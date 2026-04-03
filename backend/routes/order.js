const router = require('express').Router();
const Order = require('../models/Order');
const PromoCode = require('../models/PromoCode');
const User = require('../models/User');

// Create order with delivery fee + delivery time calculation
router.post('/', async (req, res) => {
  try {
    const { deliveryDistance, promoCode } = req.body;
    let deliveryFee = 0;
    if (deliveryDistance && deliveryDistance > 5) {
      deliveryFee = Math.round((deliveryDistance - 5) * 5000);
    }

    // Calculate delivery time (~3 min/km, min 15 min)
    const estimatedMinutes = deliveryDistance ? Math.max(15, Math.round(deliveryDistance * 3 + 10)) : 30;
    const deliveryTime = `${estimatedMinutes} phút`;

    // Handle promo code
    let promoDiscount = 0;
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), active: true });
      if (promo && promo.usedCount < promo.maxUses) {
        const now = new Date();
        if (now >= promo.validFrom && now <= promo.validTo) {
          promoDiscount = Math.round(req.body.total * promo.discountPercent / 100);
          await PromoCode.findByIdAndUpdate(promo._id, { $inc: { usedCount: 1 } });
        }
      }
    }

    const finalTotal = Math.max(0, (req.body.total || 0) - promoDiscount) + deliveryFee;

    const activeOrders = await Order.find({
      status: { $in: ['confirmed', 'delivering'] },
      shipper: { $ne: null },
    }).select('shipper');
    const busyShipperIds = activeOrders.map((o) => String(o.shipper));
    const freeShippers = await User.find({
      role: 'staff',
      _id: { $nin: busyShipperIds },
    }).select('_id name phone');

    let assignedShipper = undefined;
    let initialStatus = 'confirmed';
    if (freeShippers.length > 0) {
      assignedShipper = freeShippers[Math.floor(Math.random() * freeShippers.length)];
      initialStatus = 'delivering';
    }

    const order = new Order({
      ...req.body,
      deliveryFee,
      deliveryTime,
      total: finalTotal,
      promoCode: promoCode || undefined,
      promoDiscount,
      shipper: assignedShipper ? assignedShipper._id : undefined,
      status: initialStatus,
    });
    await order.save();
    const populated = await Order.findById(order._id)
      .populate('items.food')
      .populate('user', 'name phone')
      .populate('shipper', 'name phone');
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
    const hasActiveOrder = await Order.exists({
      _id: { $ne: req.params.id },
      shipper: shipperId,
      status: { $in: ['confirmed', 'delivering'] },
    });
    if (hasActiveOrder) {
      return res.status(409).json({ message: 'Shipper đang giao đơn khác' });
    }

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

// Assign a random available shipper to order
router.put('/:id/assign-random', async (req, res) => {
  try {
    const { deliveryDistance } = req.body;
    const activeOrders = await Order.find({ status: { $in: ['confirmed', 'delivering'] }, shipper: { $ne: null } })
      .select('shipper');
    const busyShipperIds = activeOrders.map(o => String(o.shipper));

    const freeShippers = await User.find({
      role: 'staff',
      _id: { $nin: busyShipperIds },
    }).select('_id name phone');

    if (freeShippers.length === 0) {
      return res.status(409).json({ message: 'Không có shipper rảnh' });
    }

    const picked = freeShippers[Math.floor(Math.random() * freeShippers.length)];
    let deliveryFee = 0;
    if (deliveryDistance && deliveryDistance > 5) {
      deliveryFee = Math.round((deliveryDistance - 5) * 5000);
    }

    const update = { shipper: picked._id, status: 'confirmed' };
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
