const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'avatar_' + Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
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
      cb(new Error('Chỉ chấp nhận file ảnh'));
    }
  },
});

router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const existed = await User.findOne({ username });
    if (existed) {
      return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const userData = {
      name,
      username,
      password,
      phone: '',
      address: '',
      role: 'customer',
    };
    if (req.file) {
      userData.avatar = '/uploads/' + req.file.filename;
    }

    const user = await User.create(userData);

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '2h' });
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đăng ký tài khoản' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Sai tên đăng nhập' });
    if (user.password !== password) {
      return res.status(401).json({ message: 'Sai mật khẩu' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '2h' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đăng nhập' });
  }
});

module.exports = router;
