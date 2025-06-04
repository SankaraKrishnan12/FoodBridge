   // server/routes/userRoutes.js
   const express = require('express');
   const bcrypt = require('bcryptjs');
   const jwt = require('jsonwebtoken');
   const User = require('../models/User');
   const router = express.Router();

   // User Signup
   router.post('/signup', async (req, res) => {
       const { username, password, email } = req.body;
       try {
           const hashedPassword = await bcrypt.hash(password, 10);
           const newUser  = new User({ username, password: hashedPassword, email });
           await newUser .save();
           res.status(201).json({ message: 'User  created successfully' });
       } catch (error) {
           res.status(500).json({ error: error.message });
       }
   });

   // User Login
   router.post('/login', async (req, res) => {
       const { username, password } = req.body;
       try {
           const user = await User.findOne({ username });
           if (!user) return res.status(404).json({ message: 'User  not found' });

           const isMatch = await bcrypt.compare(password, user.password);
           if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

           const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
           res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
       } catch (error) {
           res.status(500).json({ error: error.message });
       }
   });

   module.exports = router;
   