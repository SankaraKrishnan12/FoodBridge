   // server/routes/foodRoutes.js
   const express = require('express');
   const FoodPost = require('../models/FoodPost');
   const { verifyToken } = require('../middleware/authMiddleware');

   const router = express.Router();

   // Create Food Post
   router.post('/', verifyToken, async (req, res) => {
       const { foodName, description, quantity, category, expiryDate, location, availabilityWindow } = req.body;
       try {
           const foodPost = new FoodPost({ foodName, description, quantity, category, expiryDate, location, availabilityWindow, donor: req.user.id });
           await foodPost.save();
           res.status(201).json(foodPost);
       } catch (error) {
           res.status(500).json({ error: error.message });
       }
   });

   // Get All Food Posts (for demonstration)
   router.get('/', async (req, res) => {
       try {
           const foodPosts = await FoodPost.find().populate('donor', 'username');
           res.json(foodPosts);
       } catch (error) {
           res.status(500).json({ error: error.message });
       }
   });

   module.exports = router;
   