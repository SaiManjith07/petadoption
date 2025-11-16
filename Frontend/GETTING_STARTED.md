# 🎬 Getting Started - Visual Guide

## Step 1️⃣: Navigate to Frontend Folder

```
Your Computer
    ↓
c:\Users\mahip\OneDrive\Desktop\Internship\
    ↓
Frontend/ ← YOU ARE HERE
```

**Command:**
```bash
cd c:\Users\mahip\OneDrive\Desktop\Internship\Frontend
```

---

## Step 2️⃣: Install Dependencies

```
Frontend/
    ↓
package.json (contains: react, vite, tailwind, shadcn/ui, etc.)
    ↓
npm install
    ↓
node_modules/ (downloads all packages)
```

**Command:**
```bash
npm install
```

**Wait for:** 
```
added XXX packages in Xs
```

---

## Step 3️⃣: Start the Server

```
npm run dev
    ↓
Looks at package.json
    ↓
Runs: nodemon src/server.js
    ↓
Starts server on port 8000
    ↓
Connects to MongoDB Atlas
    ↓
Success! ✅
```

**Command:**
```bash
npm run dev
```

**Success Message:**
```
✅ MongoDB Connected: cluster0.fw5twko.mongodb.net

╔═══════════════════════════════════╗
║   🐾 Paws Unite Backend Server    ║
║   Running on port 8000            ║
║   Environment: development        ║
╚═══════════════════════════════════╝
```

---

## Step 4️⃣: Test the Server

**Open Another Terminal/Command Prompt:**

```bash
curl http://localhost:8000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ Backend is running",
  "timestamp": "2024-11-15T10:30:00.000Z"
}
```

✅ Backend is working!

---

## 🎯 Full Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Computer                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Terminal 1: Backend                                 │  │
│  │                                                      │  │
│  │  $ cd backend                                        │  │
│  │  $ npm install                                       │  │
│  │  $ npm run dev                                       │  │
│  │                                                      │  │
│  │  ✅ Backend Running on :8000                         │  │
│  │  ✅ MongoDB Connected                               │  │
│  └──────────────────────────────────────────────────────┘  │
│           ↓ (HTTP/REST)                                     │
│           ↓ (WebSocket)                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Terminal 2: Frontend                                │  │
│  │                                                      │  │
│  │  $ npm run dev                                       │  │
│  │                                                      │  │
│  │  ✅ Frontend Running on :8080                        │  │
│  │  http://localhost:8080                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
           ↓ (HTTPS)
┌─────────────────────────────────────────────────────────────┐
│               MongoDB Atlas (Cloud)                         │
│         cluster0.fw5twko.mongodb.net                        │
│                                                              │
│  Collections:                                               │
│  ├── users (from registration/login)                        │
│  ├── pets (from pet reports)                                │
│  └── chats (from messages)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌳 File Organization (What Does What)

### Config Folder
```
config/mongodb.js
    ↓
Connects to MongoDB using credentials from .env
    ↓
Makes database available to app
```

### Models Folder
```
models/User.js     → Database structure for users
models/Pet.js      → Database structure for pets  
models/Chat.js     → Database structure for messages
```

### Controllers Folder
```
controllers/authController.js  → Handles: register, login, getMe
controllers/petController.js   → Handles: create, list, update, delete, verify
```

### Routes Folder
```
routes/authRoutes.js  → Maps URLs to authController
routes/petRoutes.js   → Maps URLs to petController
```

### Middleware Folder
```
middleware/auth.js          → Protects routes with JWT
middleware/errorHandler.js  → Catches all errors
```

---

## 🔗 How a Request Works

```
1. FRONTEND makes request
   GET http://localhost:8000/api/pets
   ↓
2. EXPRESS receives request
   routes/petRoutes.js matches URL
   ↓
3. CONTROLLER processes
   petController.js → getAllPets function
   ↓
4. MONGOOSE queries
   models/Pet.js → finds all pets
   ↓
5. MONGODB returns data
   pawsunite database
   ↓
6. RESPONSE sent back
   {success: true, data: [...]}
   ↓
7. FRONTEND receives data
   Displays on page
```

---

## 📊 Endpoints Quick Reference

### User Registration
```
POST http://localhost:8000/api/auth/register
{
  "name": "John",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
→ Returns: JWT token + user info
```

### User Login
```
POST http://localhost:8000/api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
→ Returns: JWT token
```

### Get All Pets
```
GET http://localhost:8000/api/pets
→ Returns: List of pets with pagination
```

### Create Pet Report
```
POST http://localhost:8000/api/pets
Headers: Authorization: Bearer YOUR_TOKEN
{
  "species": "Dog",
  "breed": "Golden Retriever",
  "color": "Golden",
  "location": "Central Park",
  ...
}
→ Returns: Created pet object
```

---

## 🧪 Testing Workflow

### Option 1: Use Postman (Easiest)
```
1. Download Postman
2. Open: backend/POSTMAN_COLLECTION.json
3. Click "Send" on any endpoint
4. See response
```

### Option 2: Use Terminal Commands
```bash
# Test 1: Health Check
curl http://localhost:8000/api/health

# Test 2: Register User
curl -X POST http://localhost:8000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test\",\"email\":\"test@example.com\",\"password\":\"123456\"}"

# Test 3: Get Pets
curl http://localhost:8000/api/pets
```

### Option 3: Use Browser
```
Open: http://localhost:8000/api/health
See JSON response
```

---

## 🔄 Development Workflow (Daily)

```
Morning:
├─ Open Terminal 1
├─ cd backend && npm run dev
└─ ✅ Backend ready

├─ Open Terminal 2  
├─ npm run dev (in root)
└─ ✅ Frontend ready

Coding:
├─ Make changes to files
├─ Files auto-reload (nodemon)
└─ Test in browser/Postman

Evening:
├─ Ctrl+C to stop servers
├─ Git commit changes
└─ Done!
```

---

## 📱 Terminal 1 vs Terminal 2

### Terminal 1 (Backend)
```
Input:  cd backend && npm run dev
Output: 🐾 Paws Unite Backend Server
        Running on port 8000
Status: KEEP RUNNING
Action: Ctrl+C to stop
```

### Terminal 2 (Frontend)
```
Input:  npm run dev
Output: Local: http://localhost:8080
Status: KEEP RUNNING
Action: Ctrl+C to stop
```

**Both must run simultaneously for full app to work!**

---

## 🎬 Common Scenarios

### Scenario 1: Start Everything Fresh
```bash
# Terminal 1
cd backend
npm install
npm run dev

# Terminal 2
npm run dev
```

### Scenario 2: Resume Development
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
npm run dev
```

### Scenario 3: Test API Endpoints
```bash
# Use Postman OR
curl http://localhost:8000/api/pets
```

### Scenario 4: Check Database
```
1. Go to https://cloud.mongodb.com
2. Login
3. Click Cluster0
4. Click Collections
5. View data
```

---

## 🆘 Troubleshooting Quick Fixes

### Problem: "Port 8000 already in use"
```bash
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill that process (replace PID)
taskkill /PID 1234 /F

# OR change port in .env
PORT=8001
```

### Problem: "Cannot find module"
```bash
cd backend
rm -r node_modules
npm install
```

### Problem: "MongoDB connection failed"
```
1. Check internet connection
2. Verify credentials in .env
3. Check MongoDB Atlas IP whitelist
4. Restart server
```

### Problem: "Frontend can't connect to backend"
```
1. Ensure backend is running on :8000
2. Check VITE_API_URL = http://localhost:8000/api
3. Check CORS enabled in server.js
4. Restart both servers
```

---

## ✅ Checklist Before Starting

- [ ] Have .env file in backend/ folder
- [ ] Have MongoDB credentials in .env
- [ ] Have Node.js and npm installed
- [ ] Have 2 terminals open
- [ ] Read QUICKSTART.md (quick reference)
- [ ] Have Postman ready (for testing)

---

## 🚀 GO TIME!

```
Terminal 1: cd backend && npm run dev
Terminal 2: npm run dev
Browser:   http://localhost:8080
API:       http://localhost:8000/api

✅ Everything Running!
```

---

## 📚 Reference Documents

| Need | File |
|------|------|
| Step by step | INSTALLATION_CHECKLIST.md |
| Quick start | QUICKSTART.md |
| Full setup | SETUP.md |
| API docs | backend/README.md |
| File tree | PROJECT_STRUCTURE.md |
| Architecture | .github/copilot-instructions.md |

---

**You've got this! Happy coding! 🎉**
