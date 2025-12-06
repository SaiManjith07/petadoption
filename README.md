# 🐾 PetReunite - Pet Adoption & Rescue Platform

A comprehensive full-stack pet adoption, rescue, and reunification platform built with Django REST Framework and React. Features volunteer management, shelter coordination, feeding point tracking, and intelligent lost/found pet matching.

## 📁 Project Structure

```
petadoption/
├── backend/              # Django REST Framework Backend
│   ├── users/           # User, Volunteer, Shelter, Feeding models
│   ├── pets/            # Pet listings, adoption, lost/found workflow
│   ├── chats/           # Chat/messaging system
│   ├── adminpanel/      # Admin operations & dashboard
│   ├── notifications/   # Notification system
│   └── api/            # API routing layer
│
└── Frontend/            # React + TypeScript Frontend
    └── src/
        ├── api/        # Centralized API layer (Axios)
        ├── models/     # TypeScript interfaces
        ├── lib/        # Core libraries (auth, utils)
        ├── components/ # Reusable UI components
        └── pages/      # Page components
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (or use Neon DB)

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv petadoption
.\petadoption\Scripts\Activate.ps1  # Windows PowerShell
# or
source petadoption/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure database in backend/backend/settings.py
# (Already configured for Neon PostgreSQL)

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (admin account)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

**Backend API**: http://127.0.0.1:8000/api/

### Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend**: http://localhost:8080 (or port shown in terminal)

## 🎯 Key Features

### User Features
- **User Authentication**: Register, login, JWT-based auth
- **Volunteer Registration**: Become an NGO volunteer with shelter capacity
- **Shelter Registration**: Register shelters with capacity and area tracking
- **Pet Listings**: Browse adoptable pets with filters
- **Lost/Found Reports**: Report lost or found pets
- **Adoption Applications**: Apply to adopt pets
- **Chat System**: Communicate with other users, shelters, volunteers
- **Feeding Points**: View feeding centers and record feeding activities
- **Notifications**: Real-time notifications for pet matches, approvals, etc.

### Admin Features
- **Dashboard**: Statistics, pending reports, adoption requests
- **Verification**: Verify volunteers, shelters, and pet reports
- **Shelter Management**: Create and manage shelters
- **Feeding Points**: Create and manage feeding centers
- **User Management**: View and manage all users
- **Pet Management**: Approve/reject pet reports, manage listings

### Workflow Features

#### Found Pet Workflow
1. User reports found pet → Status: 'Pending'
2. Admin approves → Status: 'Found'
3. System checks if user is volunteer:
   - If volunteer → Ask: "Can you provide shelter?"
   - If not → Ask: "Interested in providing shelter?"
4. If user can't provide shelter:
   - Show nearby verified shelters
   - Show nearby volunteers with shelter capacity
   - User chooses: Move to shelter OR Assign to volunteer
5. After 15 days in care:
   - System alerts user
   - User decides: Keep pet OR Move to adoption listing
   - If moved to adoption → Notify shelter (if applicable)

#### Lost Pet Matching
- Matches lost pets with:
  - Found pets
  - Pets in shelters
  - Pets with registered users/volunteers
- Location and breed-based matching
- Claim system with admin verification
- Automatic chat room creation for reunification

#### Feeding System
- Admin creates feeding points (visible to all users)
- Users can record feeding activities:
  - At feeding points
  - At shelters (if accepts feeding)
  - At custom locations
- Upload photos of feeding
- View feeding records and history

## 🛠️ Tech Stack

### Backend
- **Django 5.2.8** - Web framework
- **Django REST Framework** - API framework
- **PostgreSQL (Neon)** - Database
- **JWT Authentication** - Token-based auth
- **CORS** - Cross-origin support
- **Django Filter** - Advanced filtering

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Router** - Navigation
- **React Hook Form** - Form handling

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/me/` - Get current user
- `POST /api/auth/logout/` - Logout

### Volunteers & Shelters
- `POST /api/auth/volunteer/register/` - Register as volunteer
- `POST /api/auth/shelter/register/` - Register shelter
- `GET /api/auth/shelters/nearby/` - Find nearby shelters
- `GET /api/auth/volunteers/nearby/` - Find nearby volunteers
- `GET /api/auth/admin/volunteers/pending/` - Admin: Pending volunteers
- `POST /api/auth/admin/volunteers/<id>/verify/` - Admin: Verify volunteer
- `POST /api/auth/admin/shelters/<id>/verify/` - Admin: Verify shelter

### Feeding Points
- `GET /api/auth/feeding-points/` - List all feeding points
- `POST /api/auth/admin/feeding-points/create/` - Admin: Create point
- `POST /api/auth/feeding-records/create/` - Create feeding record
- `GET /api/auth/feeding-records/my/` - Get user's feeding records

### Pets
- `GET /api/pets/` - List all pets
- `POST /api/pets/lost/` - Report lost pet
- `POST /api/pets/found/` - Report found pet
- `POST /api/pets/<id>/workflow/` - Found pet workflow decisions
- `POST /api/pets/<id>/check-adoption/` - Check 15-day adoption rule
- `GET /api/pets/lost/<id>/match/` - Match lost pet
- `POST /api/pets/found/<id>/claim/` - Claim found pet

### Admin
- `GET /api/admin/dashboard/` - Dashboard statistics
- `GET /api/admin/pending/` - Pending pet reports
- `GET /api/admin/adoptions/pending/` - Pending adoptions
- `GET /api/admin/chats/` - All chat rooms
- `POST /api/admin/pets/<id>/approve/` - Approve pet report

## 📝 Environment Variables

### Backend (.env in backend/)
```env
DATABASE_URL=postgresql://user:pass@host/dbname
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (.env in Frontend/)
```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## 🗄️ Database Models

### Core Models
- **User**: Custom user model with roles (user, volunteer, shelter, admin)
- **Volunteer**: Volunteer profiles with shelter capacity
- **Shelter**: Shelter management with capacity tracking
- **Pet**: Pet listings with lost/found/adoption status
- **FeedingPoint**: Admin-managed feeding centers
- **FeedingRecord**: User feeding activities with photos
- **ChatRoom**: Chat rooms for communication
- **Notification**: User notifications
- **AdoptionApplication**: Adoption requests

## 🔐 Authentication

- JWT-based authentication
- Access tokens (15 min expiry)
- Refresh tokens (7 days expiry)
- Automatic token refresh on 401
- Token stored in localStorage

## 🎨 UI/UX Features

- Responsive design (mobile, tablet, desktop)
- Clean, modern interface
- Split-screen login/register
- Real-time notifications
- Image upload support
- Search and filtering
- Admin dashboard with statistics

## 📦 Installation

### Backend Dependencies
```
django>=5.2.8
djangorestframework>=3.14.0
django-cors-headers>=4.0.0
djangorestframework-simplejwt>=5.2.0
psycopg2-binary>=2.9.0
python-dotenv>=1.0.0
django-filter>=23.0
```

### Frontend Dependencies
```
react>=18.0.0
typescript>=5.0.0
axios>=1.7.0
react-router-dom>=6.0.0
tailwindcss>=3.0.0
```

## 🧪 Testing

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd Frontend
npm test
```

## 🚀 Deployment

### Backend
- Deploy to: Railway, Render, Heroku, or any Python hosting
- Set environment variables
- Run migrations
- Collect static files: `python manage.py collectstatic`

### Frontend
- Build: `npm run build`
- Deploy to: Vercel, Netlify, or any static hosting
- Set API URL in environment variables

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ for pet rescue and adoption**
