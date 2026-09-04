const crypto = require('crypto');
const mongoose = require('mongoose');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makePickupCode() {
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return code;
}

function missingCode(value) {
  return !value || String(value).trim().length < 4;
}

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
  pickupCode: { type: String, trim: true, uppercase: true },
  requestedAt: { type: Date, default: Date.now }
}, { timestamps: true });

claimSchema.index({ foodPost: 1, recipient: 1 }, { unique: true });

claimSchema.pre('validate', function (next) {
  if (missingCode(this.pickupCode)) this.pickupCode = makePickupCode();
  next();
});

claimSchema.statics.makePickupCode = makePickupCode;

claimSchema.statics.ensureCodes = async function (docs) {
  for (const claim of docs) {
    if (missingCode(claim.pickupCode)) {
      claim.pickupCode = makePickupCode();
      await this.collection.updateOne(
        { _id: claim._id },
        { $set: { pickupCode: claim.pickupCode } }
      );
    }
  }
  return docs;
};

claimSchema.statics.backfillCodes = async function () {
  const missing = await this.collection.find({
    $or: [
      { pickupCode: { $exists: false } },
      { pickupCode: null },
      { pickupCode: '' }
    ]
  }).toArray();
  for (const doc of missing) {
    await this.collection.updateOne(
      { _id: doc._id },
      { $set: { pickupCode: makePickupCode() } }
    );
  }
  if (missing.length) {
    console.log(`Backfilled pickup codes on ${missing.length} claim(s)`);
  }
};

delete mongoose.models.Claim;
module.exports = mongoose.model('Claim', claimSchema);
