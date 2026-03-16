const mongoose = require('mongoose');

const OptionChoiceSchema = new mongoose.Schema({
  name: String,
  extraPrice: { type: Number, default: 0 },
});

const OptionGroupSchema = new mongoose.Schema({
  name: String,
  required: { type: Boolean, default: false },
  maxSelect: { type: Number, default: 1 },
  choices: [OptionChoiceSchema],
});

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
  options: [OptionGroupSchema],
  isFlashSale: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  promoActive: { type: Boolean, default: false },
  eventType: { type: String, enum: ['none', 'flashsale', 'hourly', 'blackfriday'], default: 'none' },
});

module.exports = mongoose.model('Food', FoodSchema);
