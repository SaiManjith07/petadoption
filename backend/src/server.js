import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './config/mongodb.js';
import { errorHandler } from './middleware/errorHandler.js';
import {
  securityHeaders,
  apiRateLimiter,
  adminRateLimiter,
  sanitizeQuery,
  requestSizeLimiter,
} from './middleware/security.js';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/authRoutes.js';
import petRoutes from './routes/petRoutesV2.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roleRequestRoutes from './routes/roleRequestRoutes.js';
import shelterCapacityRoutes from './routes/shelterCapacityRoutes.js';
import homeCheckRoutes from './routes/homeCheckRoutes.js';
import feedingPointRoutes from './routes/feedingPointRoutes.js';
import neighborhoodAlertRoutes from './routes/neighborhoodAlertRoutes.js';
import shelterRegistrationRoutes from './routes/shelterRegistrationRoutes.js';
import feedingRecordRoutes from './routes/feedingRecordRoutes.js';
import foundPetWorkflowRoutes from './routes/foundPetWorkflowRoutes.js';
import lostPetWorkflowRoutes from './routes/lostPetWorkflowRoutes.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time chat with security
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Security Middleware (apply first)
app.use(securityHeaders);

// Request size limiting
app.use(requestSizeLimiter('10mb'));

// Body parsing with limits
app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50 }));

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  })
);

// Query sanitization (prevent NoSQL injection)
app.use(sanitizeQuery);

// API rate limiting - apply to general routes
// Note: Admin and notification routes have their own limiters applied in their route files
app.use('/api', (req, res, next) => {
  // Skip if it's an admin or notification route (they have their own limiters)
  if (req.path.startsWith('/admin') || req.path.startsWith('/notifications')) {
    return next();
  }
  return apiRateLimiter(req, res, next);
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/role-requests', roleRequestRoutes);
app.use('/api/shelters', shelterCapacityRoutes);
app.use('/api/home-checks', homeCheckRoutes);
app.use('/api/feeding-points', feedingPointRoutes);
app.use('/api/alerts', neighborhoodAlertRoutes);
app.use('/api/shelter-registrations', shelterRegistrationRoutes);
app.use('/api/feeding-records', feedingRecordRoutes);
app.use('/api/found-pet-workflow', foundPetWorkflowRoutes);
app.use('/api/lost-pet-workflow', lostPetWorkflowRoutes);

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

// Socket.IO connection handling for real-time chat with security
io.use((socket, next) => {
  // Validate socket connection
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  
  if (!token) {
    return next(new Error('Authentication required'));
  }
  
  // Verify token (you can add JWT verification here)
  // For now, allow connection but validate in message handlers
  next();
});

io.on('connection', (socket) => {
  console.log(`🔌 New socket connection: ${socket.id}`);

  // Join chat room with validation
  socket.on('join-room', (roomId) => {
    // Validate roomId format
    if (!roomId || typeof roomId !== 'string' || roomId.length > 100) {
      socket.emit('error', { message: 'Invalid room ID' });
      return;
    }
    
    // Sanitize roomId
    const sanitizedRoomId = roomId.replace(/[^a-zA-Z0-9-_]/g, '');
    socket.join(sanitizedRoomId);
    console.log(`📍 User joined room: ${sanitizedRoomId}`);
  });

  // Send message with validation
  socket.on('send-message', (message) => {
    try {
      const { roomId, userId, text } = message;
      
      // Validate message data
      if (!roomId || !userId || !text) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }
      
      // Validate text length
      if (typeof text !== 'string' || text.length > 1000 || text.length < 1) {
        socket.emit('error', { message: 'Message must be between 1 and 1000 characters' });
        return;
      }
      
      // Sanitize roomId
      const sanitizedRoomId = roomId.replace(/[^a-zA-Z0-9-_]/g, '');
      
      // Validate userId format (MongoDB ObjectId)
      if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
        socket.emit('error', { message: 'Invalid user ID' });
        return;
      }
      
      // Emit to room
      io.to(sanitizedRoomId).emit('receive-message', {
        userId,
        text: text.substring(0, 1000), // Ensure max length
        timestamp: new Date(),
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
      console.error('Socket message error:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id}, reason: ${reason}`);
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
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
