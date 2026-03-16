const router = require('express').Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Food = require('../models/Food');

router.get('/', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalFoods = await Food.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalShippers = await User.countDocuments({ role: 'staff' });
    res.json({ totalOrders, totalRevenue, totalFoods, totalUsers, totalShippers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
