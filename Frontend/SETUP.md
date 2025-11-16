# 🐾 Paws Unite - Full Stack Setup Guide

## 📋 Project Structure

```
Internship/
├── Frontend/          # React + Vite + Tailwind CSS
├── backend/           # Express.js + MongoDB + Socket.IO
├── README.md          # Project overview
├── QUICKSTART.md      # 5-minute quick start
└── STRUCTURE_GUIDE.md # Detailed structure explanation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB Atlas account (already set up)
- Code editor (VS Code recommended)

### Installation

#### 1. Frontend Setup
```bash
# Navigate to Frontend directory
cd Internship\Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will run at: `http://localhost:8080`

#### 2. Backend Setup
```bash
# Navigate to backend directory
cd Internship\backend

# Install dependencies
npm install

# Create .env file with MongoDB credentials (already provided in .env.example)
cp .env.example .env

# Start development server
npm run dev
```
Backend will run at: `http://localhost:8000`

### Running Both Simultaneously

**Terminal 1 - Frontend:**
```bash
cd paws-unite
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

## 🔐 MongoDB Connection

**Atlas Cluster Details:**
- **Username**: `b210074`
- **Password**: `b210074pavankumar`
- **Database**: `pawsunite`
- **Connection String**: `mongodb+srv://b210074:b210074pavankumar@cluster0.fw5twko.mongodb.net/?appName=Cluster0`

The connection string is already in `/backend/.env.example`

## 📡 API Configuration

### Frontend to Backend Communication

The frontend is configured to communicate with the backend at:
- **Development**: `http://localhost:8000/api`
- **Production**: Set via `VITE_API_URL` environment variable

Update `/src/services/api.ts` to use real backend API instead of mocks:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```

### Available Endpoints

**Authentication**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

**Pets**
- `GET /api/pets` - Get all pets
- `GET /api/pets/:id` - Get pet details
- `POST /api/pets` - Create pet report
- `PUT /api/pets/:id` - Update pet
- `DELETE /api/pets/:id` - Delete pet
- `PATCH /api/pets/:id/verify` - Verify pet (admin)

**Health Check**
- `GET /api/health` - Check server status

## 🔧 Development Commands

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend
```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
```

## 📚 Documentation

- **Frontend**: See `/README.md` and `/README_APP.md`
- **Backend**: See `/backend/README.md`
- **AI Instructions**: See `/.github/copilot-instructions.md`

## 🔄 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vite + React)                  │
│              http://localhost:8080                          │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     │ WebSocket (Socket.IO)
┌────────────────────▼────────────────────────────────────────┐
│                   Backend (Express.js)                       │
│              http://localhost:8000                          │
└────────────────────┬────────────────────────────────────────┘
                     │ MongoDB Driver
┌────────────────────▼────────────────────────────────────────┐
│                  MongoDB Atlas Cloud                         │
│          mongodb+srv://...@cluster0...                       │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Key Files Reference

### Frontend
- `/src/App.tsx` - Main app routes
- `/src/services/api.ts` - API integration (UPDATE THIS)
- `/src/lib/auth.tsx` - Authentication context
- `/src/pages/` - Page components

### Backend
- `/backend/src/server.js` - Express server setup
- `/backend/src/config/mongodb.js` - MongoDB connection
- `/backend/src/models/` - Database schemas
- `/backend/src/routes/` - API endpoints
- `/backend/src/controllers/` - Business logic
- `/backend/src/middleware/` - Auth & error handling

## ⚙️ Environment Variables

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://b210074:b210074pavankumar@cluster0.fw5twko.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=pawsunite
PORT=8000
NODE_ENV=development
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:8080
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verify internet connection
- Check if IP address is whitelisted in MongoDB Atlas
- Confirm credentials in `.env`

### Port Already in Use
- Change port in `.env` (default: 8000 for backend, 8080 for frontend)
- Or kill existing process: `lsof -i :8000`

### Frontend Can't Connect to Backend
- Ensure backend is running on port 8000
- Check `VITE_API_URL` environment variable
- Verify CORS is enabled in backend

## 📞 Support

For issues or questions about the project setup, refer to:
- Backend documentation: `/backend/README.md`
- Frontend documentation: `/README_APP.md`
- GitHub Copilot Instructions: `/.github/copilot-instructions.md`

---

**Happy coding! 🚀**
