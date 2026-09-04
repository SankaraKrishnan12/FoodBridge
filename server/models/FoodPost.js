const mongoose = require('mongoose');

const foodPostSchema = new mongoose.Schema({
  foodName: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  quantityRemaining: { type: Number, min: 0 },
  category: { type: String, enum: ['home-cooked', 'packaged'], required: true },
  expiryDate: { type: Date, required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  availabilityWindow: { type: String, required: true },
  status: {
    type: String,
    enum: ['available', 'claimed', 'expired', 'cancelled', 'collected'],
    default: 'available'
  },
  photo: { type: String, default: '' },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

foodPostSchema.index({ location: '2dsphere' });

foodPostSchema.pre('save', function (next) {
  if (this.quantityRemaining == null) {
    this.quantityRemaining = this.quantity;
  }
  next();
});

const FoodPost = mongoose.models.FoodPost || mongoose.model('FoodPost', foodPostSchema);

module.exports = FoodPost;
