const express = require('express');
const User = require('../models/User');
const Claim = require('../models/Claim');
const FoodPost = require('../models/FoodPost');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const { applyClaimStatus, cancelFoodPost, expireStalePosts } = require('../utils/foodLifecycle');

const router = express.Router();

router.use(verifyToken);
router.use(checkRole(['Admin']));

router.get('/claims', async (_req, res) => {
  try {
    const claims = await Claim.find()
      .populate('recipient', 'username email role')
      .populate({ path: 'foodPost', populate: { path: 'donor', select: 'username' } })
      .sort({ requestedAt: -1 })
      .lean();
    await Claim.ensureCodes(claims);
    res.json(claims);
  } catch (err) {
    console.error('Error fetching claims:', err);
    res.status(500).json({ message: 'Server error fetching claims' });
  }
});

router.patch('/claims/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ['pending', 'approved', 'collected', 'rejected'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
  if (status === 'pending') {
    return res.status(400).json({ message: 'Cannot revert a claim to pending' });
  }

  try {
    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    await applyClaimStatus(claim, status, req.body.pickupCode);
    const updated = await Claim.findById(id)
      .populate('recipient', 'username email role')
      .populate('foodPost');
    res.json({ message: 'Claim status updated', claim: updated });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const allowedRoles = ['Donor', 'Recipient', 'Admin'];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role value' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.role = role;
    await user.save();
    res.json({
      message: 'User role updated',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await FoodPost.find({ donor: id }).select('_id');
    const postIds = posts.map((p) => p._id);

    await Claim.deleteMany({
      $or: [{ recipient: id }, { foodPost: { $in: postIds } }]
    });
    await FoodPost.deleteMany({ donor: id });
    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/food', async (_req, res) => {
  try {
    await expireStalePosts();
    const posts = await FoodPost.find()
      .populate('donor', 'username email')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/food/:id/cancel', async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Food post not found' });
    const updated = await cancelFoodPost(post);
    res.json(updated);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

router.delete('/food/:id', async (req, res) => {
  try {
    const post = await FoodPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Food post not found' });
    await Claim.deleteMany({ foodPost: post._id });
    res.json({ message: 'Food post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
