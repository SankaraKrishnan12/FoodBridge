const express = require('express');
const Claim = require('../models/Claim');
const FoodPost = require('../models/FoodPost');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const {
  expireStalePosts,
  isPubliclyAvailable,
  applyClaimStatus,
  notify
} = require('../utils/foodLifecycle');

const router = express.Router();

router.post('/', verifyToken, checkRole(['Recipient']), async (req, res) => {
  const { foodPostId } = req.body;
  const recipientId = req.user.id;

  if (!foodPostId) {
    return res.status(400).json({ message: 'foodPostId is required' });
  }

  try {
    await expireStalePosts();
    const foodPost = await FoodPost.findById(foodPostId);
    if (!foodPost) {
      return res.status(404).json({ message: 'Food post not found' });
    }
    if (!isPubliclyAvailable(foodPost)) {
      return res.status(400).json({ message: 'This food is not available to request' });
    }

    const claim = await Claim.create({
      foodPost: foodPostId,
      recipient: recipientId,
      status: 'pending',
      pickupCode: Claim.makePickupCode()
    });
    await notify(
      foodPost.donor,
      `New request for ${foodPost.foodName}. Approve it from My Posts.`
    );

    res.status(201).json({
      message: 'Claim request created',
      pickupCode: claim.pickupCode,
      claim
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already requested this food post' });
    }
    res.status(500).json({ message: error.message });
  }
});

router.get('/', verifyToken, checkRole(['Recipient']), async (req, res) => {
  try {
    const claims = await Claim.find({ recipient: req.user.id })
      .populate({ path: 'foodPost', populate: { path: 'donor', select: 'username' } })
      .sort({ requestedAt: -1 })
      .lean();
    await Claim.ensureCodes(claims);
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/incoming', verifyToken, checkRole(['Donor', 'Admin']), async (req, res) => {
  try {
    const posts = await FoodPost.find(
      req.user.role === 'Admin' ? {} : { donor: req.user.id }
    ).select('_id');
    const postIds = posts.map((p) => p._id);
    const claims = await Claim.find({ foodPost: { $in: postIds } })
      .populate({ path: 'foodPost', populate: { path: 'donor', select: 'username' } })
      .populate('recipient', 'username email')
      .sort({ requestedAt: -1 })
      .lean();
    await Claim.ensureCodes(claims);
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id', verifyToken, checkRole(['Donor', 'Admin']), async (req, res) => {
  const { status } = req.body;
  try {
    const claim = await Claim.findById(req.params.id).populate('foodPost');
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    const post = claim.foodPost;
    const isOwner = post && String(post.donor) === String(req.user.id);
    if (req.user.role !== 'Admin' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }

    await applyClaimStatus(claim, status, req.body.pickupCode);
    const updated = await Claim.findById(claim._id)
      .populate('foodPost')
      .populate('recipient', 'username email');
    res.json({ message: 'Claim status updated', claim: updated });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

module.exports = router;
