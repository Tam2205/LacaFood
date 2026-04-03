const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['flashsale', 'hourly', 'blackfriday'] },
  discount: { type: Number, default: 0 },
  startHour: { type: Number, min: 0, max: 23 },
  endHour: { type: Number, min: 0, max: 23 },
  startTime: Date,
  endTime: Date,
  foods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', EventSchema);
