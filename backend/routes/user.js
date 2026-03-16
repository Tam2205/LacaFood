const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'avatar_' + Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Get staff/shippers list
router.get('/staff', async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('name phone');
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new staff/shipper account
router.post('/staff', async (req, res) => {
  try {
    const { name, phone, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Thiếu thông tin tạo shipper' });
    }

    const existed = await User.findOne({ username });
    if (existed) {
      return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const staff = await User.create({
      name,
      username,
      password,
      phone: phone || '',
      address: '',
      role: 'staff',
    });

    res.status(201).json({
      _id: staff._id,
      name: staff.name,
      phone: staff.phone,
      username: staff.username,
      role: staff.role,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update user profile (with optional avatar)
router.put('/:id', upload.single('avatar'), async (req, res) => {
  try {
    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.phone !== undefined) data.phone = req.body.phone;
    if (req.body.address !== undefined) data.address = req.body.address;
    if (req.file) data.avatar = '/uploads/' + req.file.filename;
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
