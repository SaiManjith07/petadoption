import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './config/mongodb.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import petRoutes from './routes/petRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time chat
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
  })
);

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Backend is running',
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO connection handling for real-time chat
io.on('connection', (socket) => {
  console.log(`🔌 New socket connection: ${socket.id}`);

  // Join chat room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`📍 User joined room: ${roomId}`);
  });

  // Send message
  socket.on('send-message', (message) => {
    const { roomId, userId, text } = message;
    io.to(roomId).emit('receive-message', {
      userId,
      text,
      timestamp: new Date(),
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════╗
  ║   🐾 Paws Unite Backend Server    ║
  ║   Running on port ${PORT}            ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}       ║
  ╚═══════════════════════════════════╝
  `);
});

export default app;
