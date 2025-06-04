   // server/routes/userRoutes.js
   const express = require('express');
   const bcrypt = require('bcryptjs');
   const jwt = require('jsonwebtoken');
   const User = require('../models/User');
   const router = express.Router();

   // User Signup
   router.post('/signup', async (req, res) => {
       const { username, email, password, role } = req.body;
       try {
           // Check if user already exists
           const existingUser  = await User.findOne({ email });
           if (existingUser ) {
               return res.status(400).json({ message: 'User already exists' });
           }
           const hashedPassword = await bcrypt.hash(password, 10);
           const newUser  = new User({
               username,
               email,
               password: hashedPassword, // Make sure to hash the password before saving
               role // Ensure this is included
           });
           await newUser.save();
           res.status(201).json({ message: 'User created successfully', user: newUser  });
       } catch (error) {
           console.error('Error during signup:', error);
           res.status(500).json({ message: 'Server error' });
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
   