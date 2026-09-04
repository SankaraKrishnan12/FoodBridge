const express = require('express');
const FoodPost = require('../models/FoodPost');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/upload');
const { expireStalePosts, cancelFoodPost } = require('../utils/foodLifecycle');

const router = express.Router();

function parseLocation(location) {
  if (!location) return null;
  if (typeof location === 'string') {
    try {
      return JSON.parse(location);
    } catch {
      return null;
    }
  }
  return location;
}

function parseBody(req) {
  const location = parseLocation(req.body.location);
  return {
    foodName: req.body.foodName,
    description: req.body.description,
    quantity: req.body.quantity != null ? Number(req.body.quantity) : undefined,
    category: req.body.category,
    expiryDate: req.body.expiryDate,
    location,
    availabilityWindow: req.body.availabilityWindow,
    photo: req.file ? req.file.filename : undefined
  };
}

function canManage(req, post) {
  return req.user.role === 'Admin' || String(post.donor) === String(req.user.id);
}

router.get('/', async (req, res) => {
  try {
    await expireStalePosts();
    const filter = {
      status: 'available',
      quantityRemaining: { $gt: 0 },
      expiryDate: { $gt: new Date() }
    };
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: (Number(req.query.maxKm) || 50) * 1000
        }
      };
    }
    const query = FoodPost.find(filter).populate('donor', 'username');
    if (!filter.location) query.sort({ createdAt: -1 });
    res.json(await query);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/mine', verifyToken, checkRole(['Donor', 'Admin']), async (req, res) => {
  try {
    await expireStalePosts();
    const filter = req.user.role === 'Admin' ? {} : { donor: req.user.id };
    const foodPosts = await FoodPost.find(filter)
      .populate('donor', 'username')
      .sort({ createdAt: -1 });
    res.json(foodPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const foodPost = await FoodPost.findById(req.params.id).populate('donor', 'username');
    if (!foodPost) return res.status(404).json({ message: 'Food post not found' });
    res.json(foodPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  '/',
  verifyToken,
  checkRole(['Donor', 'Admin']),
  upload.single('photo'),
  async (req, res) => {
    try {
      const data = parseBody(req);
      if (!data.location?.coordinates || data.location.coordinates.length !== 2) {
        return res.status(400).json({ message: 'Pickup location is required' });
      }
      const [lng, lat] = data.location.coordinates.map(Number);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ message: 'Invalid pickup coordinates' });
      }
      const quantity = Number(data.quantity);
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }
      if (!data.expiryDate || new Date(data.expiryDate) <= new Date()) {
        return res.status(400).json({ message: 'Expiry must be in the future' });
      }
      const foodPost = await FoodPost.create({
        foodName: data.foodName,
        description: data.description,
        quantity,
        quantityRemaining: quantity,
        category: data.category,
        expiryDate: data.expiryDate,
        location: { type: 'Point', coordinates: [lng, lat] },
        availabilityWindow: data.availabilityWindow,
        photo: data.photo || '',
        donor: req.user.id,
        status: 'available'
      });
      res.status(201).json(foodPost);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.patch(
  '/:id',
  verifyToken,
  checkRole(['Donor', 'Admin']),
  upload.single('photo'),
  async (req, res) => {
    try {
      const foodPost = await FoodPost.findById(req.params.id);
      if (!foodPost) return res.status(404).json({ message: 'Food post not found' });
      if (!canManage(req, foodPost)) {
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
      }
      if (!['available', 'claimed'].includes(foodPost.status)) {
        return res.status(400).json({ message: 'This food post can no longer be edited' });
      }

      const data = parseBody(req);
      if (data.foodName) foodPost.foodName = data.foodName;
      if (data.description) foodPost.description = data.description;
      if (data.category) foodPost.category = data.category;
      if (data.expiryDate) foodPost.expiryDate = data.expiryDate;
      if (data.availabilityWindow) foodPost.availabilityWindow = data.availabilityWindow;
      if (data.location) foodPost.location = data.location;
      if (data.photo) foodPost.photo = data.photo;

      if (data.quantity != null) {
        const consumed = foodPost.quantity - foodPost.quantityRemaining;
        if (data.quantity < consumed) {
          return res.status(400).json({
            message: `Quantity cannot be less than ${consumed} already claimed portion(s)`
          });
        }
        foodPost.quantity = data.quantity;
        foodPost.quantityRemaining = data.quantity - consumed;
        if (foodPost.quantityRemaining > 0 && foodPost.status === 'claimed') {
          foodPost.status = 'available';
        }
      }

      await foodPost.save();
      res.json(foodPost);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.patch('/:id/cancel', verifyToken, checkRole(['Donor', 'Admin']), async (req, res) => {
  try {
    const foodPost = await FoodPost.findById(req.params.id);
    if (!foodPost) return res.status(404).json({ message: 'Food post not found' });
    if (!canManage(req, foodPost)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    if (['cancelled', 'collected'].includes(foodPost.status)) {
      return res.status(400).json({ message: 'This food post cannot be cancelled' });
    }
    const updated = await cancelFoodPost(foodPost);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
