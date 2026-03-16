require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Socket.IO for realtime shipper tracking
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Shipper joins their room
  socket.on('shipperJoin', (shipperId) => {
    socket.join(`shipper_${shipperId}`);
  });

  // Customer subscribes to track an order
  socket.on('trackOrder', (orderId) => {
    socket.join(`order_${orderId}`);
  });

  // Shipper sends location update
  socket.on('shipperLocation', ({ orderId, lat, lng }) => {
    io.to(`order_${orderId}`).emit('shipperLocationUpdate', { orderId, lat, lng });
  });

  // Broadcast order status change
  socket.on('orderStatusChange', ({ orderId, status }) => {
    io.to(`order_${orderId}`).emit('orderStatusUpdate', { orderId, status });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('La ca Food backend is running');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/foods', require('./routes/food'));
app.use('/api/events', require('./routes/event'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/users', require('./routes/user'));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
