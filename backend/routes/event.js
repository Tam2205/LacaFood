const express = require('express');
const Event = require('../models/Event');

const router = express.Router();

router.get('/', async (req, res) => {
  const events = await Event.find().populate('foods');
  res.json(events);
});

module.exports = router;
