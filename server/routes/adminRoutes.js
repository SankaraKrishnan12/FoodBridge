const express = require('express');
const User = require('../models/User');
const Claim = require('../models/Claim');
const FoodPost = require('../models/FoodPost');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Middleware for admin only
router.use(verifyToken);
router.use(checkRole(['Admin']));

/**
 * Get all claims, populated with foodPost and user info
 */
router.get('/claims', verifyToken, checkRole(['Admin']), async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate('recipient', 'username email role')
      .populate('foodPost');
    res.json(claims);
  } catch (err) {
    console.error('Error fetching claims:', err);
    res.status(500).json({ message: 'Server error fetching claims' });
  }
});

/**
 * Update claim status (approve, deny, collected, rejected)
 */
router.patch('/claims/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ['pending', 'approved', 'collected', 'rejected'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    claim.status = status;
    claim.updatedAt = Date.now();
    await claim.save();

    // Optionally update FoodPost status based on claim approval/collection here

    res.json({ message: 'Claim status updated', claim });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update user role
 */
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
    res.json({ message: 'User role updated', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete user
 */
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Optionally delete or reassign user's posts and claims here
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
