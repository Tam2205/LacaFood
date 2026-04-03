const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, sparse: true },
  password: String,
  phone: String,
  address: String,
  avatar: String,
  role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
  fcmToken: String,
});

module.exports = mongoose.model('User', UserSchema);
