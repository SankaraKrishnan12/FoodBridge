const express = require('express');
const Claim = require('../models/Claim');
const FoodPost = require('../models/FoodPost');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Create a claim (only Recipient)
router.post('/', verifyToken, checkRole(['Recipient']), async (req, res) => {
  const { foodPostId } = req.body;
  const recipientId = req.user.id;

  if (!foodPostId) {
    return res.status(400).json({ message: 'foodPostId is required' });
  }

  try {
    // Check if FoodPost exists and is available
    const foodPost = await FoodPost.findById(foodPostId);
    if (!foodPost) {
      return res.status(404).json({ message: 'Food post not found' });
    }

    // Optional: prevent duplicate claims by this user
    const existingClaim = await Claim.findOne({ foodPost: foodPostId, recipient: recipientId });
    if (existingClaim) {
      return res.status(400).json({ message: 'You have already requested this food post' });
    }

    // Create the claim
    const claim = new Claim({
      foodPost: foodPostId,
      recipient: recipientId,
      status: 'pending'
    });
    await claim.save();

    // Optional: update FoodPost status (e.g., adding a 'claimed' flag)
    // Here, simply skipping, or you can extend FoodPost schema.

    res.status(201).json({ message: 'Claim request created', claim });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all claims for the logged-in recipient
router.get('/', verifyToken, checkRole(['Recipient']), async (req, res) => {
  try {
    const claims = await Claim.find({ recipient: req.user.id })
      .populate('foodPost')
      .sort({ requestedAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
