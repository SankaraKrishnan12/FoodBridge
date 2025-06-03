   // server/models/FoodPost.js
   const mongoose = require('mongoose');

   const foodPostSchema = new mongoose.Schema({
       foodName: { type: String, required: true },
       description: { type: String, required: true },
       quantity: { type: Number, required: true },
       category: { type: String, enum: ['home-cooked', 'packaged'], required: true },
       expiryDate: { type: Date, required: true },
       location: {
           type: {
               type: String,
               enum: ['Point'], // 'Point' for geolocation
               required: true
           },
           coordinates: { type: [Number], required: true } // [longitude, latitude]
       },
       image: { type: String }, // URL of the uploaded image
       availabilityWindow: { type: String, required: true },
       donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true }
   }, { timestamps: true });

   foodPostSchema.index({ location: '2dsphere' }); // Create a geospatial index

   module.exports = mongoose.model('FoodPost', foodPostSchema);
   