const express = require('express');
const Event = require('../models/Event');
const Food = require('../models/Food');

const router = express.Router();

// GET all events (with active check for hourly events)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ active: true }).populate('foods');
    const now = new Date();
    const currentHour = now.getHours();

    // Mark hourly events as active/inactive based on current hour
    const result = events.map(e => {
      const ev = e.toObject();
      if (ev.type === 'hourly') {
        ev.isCurrentlyActive = currentHour >= ev.startHour && currentHour < ev.endHour;
      } else {
        ev.isCurrentlyActive = true;
      }
      return ev;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all events (admin - include inactive)
router.get('/all', async (req, res) => {
  try {
    const events = await Event.find().populate('foods').sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - create event
router.post('/', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();

    // Apply discount to foods in event
    if (event.foods.length > 0 && event.discount > 0) {
      await Food.updateMany(
        { _id: { $in: event.foods } },
        { discount: event.discount, isFlashSale: true, promoActive: true, eventType: event.type }
      );
    }

    const populated = await Event.findById(event._id).populate('foods');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT - update event
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('foods');
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });

    // Update foods discount when event changes
    if (event.active && event.foods.length > 0 && event.discount > 0) {
      await Food.updateMany(
        { _id: { $in: event.foods } },
        { discount: event.discount, isFlashSale: true, promoActive: true, eventType: event.type }
      );
    }

    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE event & remove discounts from foods
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });

    // Remove discounts from foods
    if (event.foods.length > 0) {
      await Food.updateMany(
        { _id: { $in: event.foods } },
        { discount: 0, isFlashSale: false, promoActive: false, eventType: 'none' }
      );
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa sự kiện', _id: event._id });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
