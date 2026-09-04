const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts, try again later' },
  validate: { xForwardedForHeader: false }
});

const signupSchema = z.object({
  username: z.string().trim().min(3).max(40),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['Donor', 'Recipient']).optional()
});

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

function publicUser(user) {
  return { id: user._id, username: user.username, email: user.email, role: user.role };
}

function issueToken(res, user) {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
  return token;
}

router.post('/signup', authLimit, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { username, email, password, role } = parsed.data;
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const newUser = await User.create({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role: role || 'Recipient'
    });
    res.status(201).json({ message: 'User created successfully', user: publicUser(newUser) });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', authLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  try {
    const user = await User.findOne({
      $or: [{ username: parsed.data.username }, { email: parsed.data.username }]
    });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = issueToken(res, user);
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
});

router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const notifications = user.notifications || [];
    res.json({
      notifications,
      unread: notifications.filter((n) => !n.read).length
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/notifications/read', verifyToken, async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user.id },
      { $set: { 'notifications.$[].read': true } }
    );
    res.json({ message: 'Notifications marked read' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
