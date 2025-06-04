   // server/server.js
   const express = require('express');
   const mongoose = require('mongoose');
   const cors = require('cors');
   const dotenv = require('dotenv');

   dotenv.config();

   const app = express();
   const PORT = process.env.PORT || 5000;

   // Middleware
   app.use(cors());
   app.use(express.json());

   // MongoDB Connection
   mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
       .then(() => console.log('MongoDB connected'))
       .catch(err => console.error(err));

   // Routes
   app.use('/api/users', require('./routes/userRoutes'));
   app.use('/api/food', require('./routes/foodRoutes'));

   app.listen(PORT, () => {
       console.log(`Server is running on http://localhost:${PORT}`);
   });
   
   app.use('/api/claims', require('./routes/claimRoutes'));

   app.use('/api/admin', require('./routes/adminRoutes'));
   
   app.use('/api/admin/users', require('./routes/userRoutes'));
