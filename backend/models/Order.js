const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
  quantity: { type: Number, default: 1 },
  price: Number,
  selectedOptions: [{ groupName: String, choiceName: String, extraPrice: Number }],
});

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  total: { type: Number, required: true },
  address: String,
  location: {
    lat: Number,
    lng: Number,
  },
  shipperLocation: {
    lat: Number,
    lng: Number,
  },
  deliveryDistance: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  deliveryTime: String,
  promoCode: String,
  promoDiscount: { type: Number, default: 0 },
  payMethod: { type: String, enum: ['cod', 'qr', 'bank', 'momo'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paymentRef: String,
  shipper: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'confirmed', 'delivering', 'done', 'cancelled'], default: 'pending' },
  note: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', OrderSchema);
