const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  image: String,
  category: {
    type: String,
    enum: ['nuoc_uong', 'lau', 'mon_nhau', 'bun_pho', 'com', 'an_vat'],
    default: 'com',
  },
  isFlashSale: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  eventType: { type: String, enum: ['none', 'flashsale', 'hourly', 'blackfriday'], default: 'none' },
});

module.exports = mongoose.model('Food', FoodSchema);
