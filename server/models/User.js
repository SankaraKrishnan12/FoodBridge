const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Donor', 'Recipient', 'Admin'], default: 'Recipient' },
  notifications: [{
    text: { type: String, required: true, maxlength: 240 },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

delete mongoose.models.User;
module.exports = mongoose.model('User', userSchema);
