const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  foodPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodPost',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'collected', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Claim', claimSchema);

