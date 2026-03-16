const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Food = require('../models/Food');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)'));
    }
  },
});

// GET all foods, optional ?category=xxx filter
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.hasDiscount === 'true') filter.discount = { $gt: 0 };
    const foods = await Food.find(filter);
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - admin add food (with optional image upload)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.body.price) data.price = Number(req.body.price);
    if (req.body.discount) data.discount = Number(req.body.discount);
    if (req.file) {
      data.image = '/uploads/' + req.file.filename;
    }
    const food = new Food(data);
    await food.save();
    res.status(201).json(food);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT - admin update food (discount, image, etc.)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.body.price) data.price = Number(req.body.price);
    if (req.body.discount) data.discount = Number(req.body.discount);
    if (req.file) {
      data.image = '/uploads/' + req.file.filename;
    }
    const food = await Food.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!food) return res.status(404).json({ message: 'Không tìm thấy món' });
    res.json(food);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
