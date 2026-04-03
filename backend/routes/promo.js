const express = require('express');
const PromoCode = require('../models/PromoCode');

const router = express.Router();

// GET all promo codes
router.get('/', async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.json(promos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - validate & apply promo code
router.post('/validate', async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    const promo = await PromoCode.findOne({ code: code.toUpperCase() });
    if (!promo) return res.status(404).json({ message: 'Mã khuyến mãi không tồn tại' });
    if (!promo.active) return res.status(400).json({ message: 'Mã khuyến mãi đã bị vô hiệu' });
    if (promo.usedCount >= promo.maxUses) return res.status(400).json({ message: 'Mã đã hết lượt sử dụng' });
    const now = new Date();
    if (now < promo.validFrom) return res.status(400).json({ message: 'Mã chưa có hiệu lực' });
    if (now > promo.validTo) return res.status(400).json({ message: 'Mã đã hết hạn' });
    if (orderTotal < promo.minOrder) return res.status(400).json({ message: `Đơn tối thiểu ${promo.minOrder}đ` });

    const discountAmount = Math.round(orderTotal * promo.discountPercent / 100);
    res.json({
      valid: true,
      code: promo.code,
      discountPercent: promo.discountPercent,
      discountAmount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - use promo code (increment usedCount)
router.post('/use', async (req, res) => {
  try {
    const { code } = req.body;
    const promo = await PromoCode.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } },
      { new: true }
    );
    if (!promo) return res.status(404).json({ message: 'Không tìm thấy mã' });
    res.json(promo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - create promo code (admin)
router.post('/', async (req, res) => {
  try {
    const promo = new PromoCode(req.body);
    await promo.save();
    res.status(201).json(promo);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Mã đã tồn tại' });
    res.status(400).json({ message: err.message });
  }
});

// DELETE promo code
router.delete('/:id', async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Không tìm thấy mã' });
    res.json({ message: 'Đã xóa', _id: promo._id });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
