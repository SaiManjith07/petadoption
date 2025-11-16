# Paws Unite Backend

Backend service for the Paws Unite Pet Adoption & Rescue Management Portal using MERN stack.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Features](#features)

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **Password Hashing**: bcryptjs
- **File Upload**: Multer + Cloudinary (optional)

## 📦 Prerequisites

- Node.js 16+ and npm
- MongoDB Atlas account with connection string
- Basic understanding of REST APIs and Express.js

## 🚀 Installation

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

## ⚙️ Configuration

Update `.env` with your credentials:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://b210074:b210074pavankumar@cluster0.fw5twko.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=pawsunite

# Server Configuration
PORT=8000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:8080

# Cloudinary (Optional for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## ▶️ Running the Server

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

Server will start at `http://localhost:8000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Pets
- `GET /api/pets` - Get all pets (with filters)
- `GET /api/pets/:id` - Get pet by ID
- `POST /api/pets` - Create new pet report (protected)
- `PUT /api/pets/:id` - Update pet (protected)
- `DELETE /api/pets/:id` - Delete pet (protected)
- `PATCH /api/pets/:id/verify` - Verify pet (admin only)

### Health Check
- `GET /api/health` - Check server status

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── mongodb.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Auth logic
│   │   └── petController.js    # Pet operations
│   ├── middleware/
│   │   ├── auth.js             # JWT protection & role authorization
│   │   └── errorHandler.js     # Global error handling
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Pet.js              # Pet schema
│   │   └── Chat.js             # Chat schema
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   └── petRoutes.js        # Pet endpoints
│   └── server.js               # Express app & Socket.IO setup
├── .env.example                 # Environment template
├── package.json
└── README.md
```

## ✨ Features

### Authentication
- User registration and login with JWT
- Password hashing with bcryptjs
- Role-based access control (user, rescuer, admin)

### Pet Management
- Report found/lost pets
- Pet verification workflow (admin)
- Search and filter pets
- Pagination support

### Real-time Chat (Socket.IO)
- Three-way communication (owner, rescuer, admin)
- Join/leave room functionality
- Message broadcasting

### Data Models
- **User**: Authentication, profile, role
- **Pet**: Complete pet information with status tracking
- **Chat**: Room-based messaging with participants

## 🔐 Security Best Practices

- JWT tokens with expiration
- Password hashing before storage
- CORS configuration for frontend
- Error handling without exposing sensitive info
- Role-based authorization checks

## 📝 Notes

- Mock data is NOT included - database operations are real
- All API responses follow a consistent `{ success, message, data }` format
- Timestamps (`createdAt`, `updatedAt`) are automatically managed by Mongoose

## 🤝 Contributing

For changes to the backend, ensure:
1. All database operations use proper error handling
2. API responses follow the standard format
3. Authentication is checked where needed
4. Admin-only routes use the `authorize` middleware

## 📧 Support

For issues or questions, contact the development team.
