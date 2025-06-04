const mongoose = require('mongoose');

const foodPostSchema = new mongoose.Schema({
  foodName: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  category: { type: String, enum: ['home-cooked', 'packaged'], required: true },
  expiryDate: { type: Date, required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  availabilityWindow: { type: String, required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

foodPostSchema.index({ location: '2dsphere' });

const FoodPost = mongoose.models.FoodPost || mongoose.model('FoodPost', foodPostSchema);

module.exports = FoodPost;
