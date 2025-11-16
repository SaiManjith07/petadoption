# 🐾 Paws Unite - MERN Stack Application

**A modern full-stack pet adoption and rescue management portal**

## 📁 Project Structure (Updated)

```
Internship/
├── backend/                    ← Node.js + Express Backend
│   ├── src/
│   │   ├── server.js
│   │   ├── config/mongodb.js
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── middleware/
│   ├── package.json
│   ├── .env
│   ├── README.md
│   └── POSTMAN_COLLECTION.json
│
├── Frontend/                   ← React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── lib/
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
└── README.md                   ← This file
```

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend runs on: `http://localhost:8000`

### Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:8080`

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js
- MongoDB (Atlas)
- JWT Authentication
- Socket.IO (Real-time)
- Mongoose ORM

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router

## 📚 Documentation

### Backend Documentation
- **Setup**: `backend/README.md`
- **API Endpoints**: `backend/POSTMAN_COLLECTION.json`

### Frontend Documentation
- **Features**: `Frontend/README_APP.md`
- **Setup**: `Frontend/README.md`

## 📊 Key Features

✅ User authentication (JWT)
✅ Pet reporting (found/lost/adoptable)
✅ Live pet matching
✅ Real-time chat (Socket.IO)
✅ Admin verification system
✅ Responsive design
✅ Dark mode support

## 🔐 MongoDB Credentials

```
Username: b210074
Password: b210074pavankumar
Database: pawsunite
Cluster: cluster0.fw5twko.mongodb.net
```

Configured in: `backend/.env`

## 📖 Setup Guides

- **Quick Start**: `Frontend/GETTING_STARTED.md`
- **Full Setup**: `Frontend/SETUP.md`
- **Checklist**: `Frontend/INSTALLATION_CHECKLIST.md`

## 🚀 Running Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

## 📞 API Configuration

Frontend connects to backend at:
- Development: `http://localhost:8000/api`
- Configure in: `Frontend/src/services/api.ts`

## 🤖 AI Developer Guidelines

See: `Frontend/.github/copilot-instructions.md`

## ✅ Status

- ✅ Backend: Production Ready
- ✅ Frontend: Production Ready
- ✅ MongoDB: Configured
- ✅ Documentation: Complete

---

**Version**: 1.0.0  
**Date**: November 15, 2025  
**Status**: ✅ Ready for Development
"# petadoption" 
