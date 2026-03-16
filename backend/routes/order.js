const router = require('express').Router();
const Order = require('../models/Order');

// Create order with delivery fee calculation
router.post('/', async (req, res) => {
  try {
    const { deliveryDistance } = req.body;
    let deliveryFee = 0;
    if (deliveryDistance && deliveryDistance > 5) {
      deliveryFee = Math.round((deliveryDistance - 5) * 5000);
    }
    const order = new Order({ ...req.body, deliveryFee });
    await order.save();
    const populated = await Order.findById(order._id).populate('items.food').populate('user', 'name phone').populate('shipper', 'name phone');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get orders - filter by user if userId provided
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.shipperId) filter.shipper = req.query.shipperId;
    const orders = await Order.find(filter)
      .populate('items.food')
      .populate('user', 'name phone address')
      .populate('shipper', 'name phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('items.food').populate('user', 'name phone').populate('shipper', 'name phone');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Assign shipper to order + set delivery distance
router.put('/:id/assign', async (req, res) => {
  try {
    const { shipperId, deliveryDistance } = req.body;
    let deliveryFee = 0;
    if (deliveryDistance && deliveryDistance > 5) {
      deliveryFee = Math.round((deliveryDistance - 5) * 5000);
    }
    const update = { shipper: shipperId, status: 'confirmed' };
    if (deliveryDistance != null) {
      update.deliveryDistance = deliveryDistance;
      update.deliveryFee = deliveryFee;
    }
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('items.food').populate('user', 'name phone address').populate('shipper', 'name phone');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update shipper location for an order
router.put('/:id/shipper-location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { shipperLocation: { lat, lng } },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
