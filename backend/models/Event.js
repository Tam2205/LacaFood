const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['flashsale', 'hourly', 'blackfriday'] },
  discount: Number,
  startTime: Date,
  endTime: Date,
  foods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
});

module.exports = mongoose.model('Event', EventSchema);
