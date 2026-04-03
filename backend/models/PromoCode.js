const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountPercent: { type: Number, required: true, min: 1, max: 100 },
  maxUses: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  minOrder: { type: Number, default: 0 },
  validFrom: { type: Date, default: Date.now },
  validTo: { type: Date, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PromoCode', PromoCodeSchema);
