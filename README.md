# 🐾 PetReunite - Pet Adoption & Rescue Platform

A comprehensive full-stack pet adoption, rescue, and reunification platform built with Django REST Framework and React. Features volunteer management, shelter coordination, feeding point tracking, intelligent lost/found pet matching, and a beautiful modern UI with consistent branding.

## ✨ Key Highlights

- 🎨 **Modern UI Design**: Beautiful, responsive interface with consistent primary color scheme (#2BB6AF)
- 🔄 **Automated Workflows**: Found pets automatically move to adoption after 15 days
- 💬 **Real-time Chat**: Integrated messaging system for pet reunification
- 📍 **Location-based Matching**: Smart matching of lost and found pets
- 🏥 **Medical Resources**: Vaccination camps and health information
- 👥 **Community Network**: Connect with volunteers, shelters, and pet lovers
- 🔔 **Real-time Notifications**: Stay updated on pet matches and approvals
- 📊 **Admin Dashboard**: Comprehensive management tools for administrators

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
        │   ├── layout/ # Sidebars, Navbars, TopNav
        │   ├── pets/   # Pet-related components
        │   ├── chat/   # Chat components
        │   └── ui/     # shadcn/ui components
        └── pages/      # Page components
            ├── auth/   # Login, Register
            ├── user/   # User dashboard, pets, profile
            └── admin/  # Admin dashboard and management
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
- **User Authentication**: Secure register, login with JWT-based auth
- **Pet Listings**: Browse adoptable, found, and lost pets with advanced filters
- **Lost/Found Reports**: Report lost or found pets with detailed information
- **Adoption Applications**: Apply to adopt pets with verification workflow
- **Chat System**: Real-time messaging for pet reunification and communication
- **Volunteer Registration**: Become an NGO volunteer with shelter capacity tracking
- **Shelter Registration**: Register shelters with capacity and area management
- **Feeding Points**: View feeding centers and record feeding activities
- **Medical Resources**: Access vaccination camps and health information
- **User Pet Records**: Manage your pet's medical records (private)
- **Notifications**: Real-time notifications for pet matches, approvals, etc.
- **Profile Management**: Complete user profile with preferences

### Admin Features
- **Dashboard**: Comprehensive statistics, pending reports, adoption requests
- **Verification System**: Verify volunteers, shelters, and pet reports
- **Shelter Management**: Create and manage shelters with location tracking
- **Feeding Points**: Create and manage feeding centers
- **User Management**: View and manage all users, roles, and permissions
- **Pet Management**: Approve/reject pet reports, manage listings
- **Chat Monitoring**: Monitor and manage chat rooms
- **Medical Records**: Manage pet medical information
- **Adoption Oversight**: Review and approve adoption applications

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
5. **After 15 days in care** (Automated):
   - System automatically alerts user
   - User decides: Keep pet OR Move to adoption listing
   - If moved to adoption → Notify shelter (if applicable)
   - Pet becomes available for adoption

#### Lost Pet Matching
- Intelligent matching system:
  - Matches lost pets with found pets
  - Matches with pets in shelters
  - Matches with pets with registered users/volunteers
- Location and breed-based matching
- Claim system with admin verification
- Automatic chat room creation for reunification
- Real-time notifications on matches

#### Feeding System
- Admin creates feeding points (visible to all users)
- Users can record feeding activities:
  - At feeding points
  - At shelters (if accepts feeding)
  - At custom locations
- Upload photos of feeding activities
- View feeding records and history
- Track feeding patterns and locations

#### Medical Resources
- **Medical Camps**: View upcoming vaccination camps by location
- **User Pet Records**: Private medical records for your pets
- **Vaccination Information**: Access schedules and health guidance
- **Camp Registration**: Register for vaccination camps

## 🛠️ Tech Stack

### Backend
- **Django 5.2.8** - Web framework
- **Django REST Framework** - API framework
- **PostgreSQL (Neon)** - Database
- **JWT Authentication** - Token-based auth with refresh tokens
- **CORS** - Cross-origin support
- **Django Filter** - Advanced filtering and search
- **Server-Sent Events (SSE)** - Real-time notifications

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Axios** - HTTP client with interceptors
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful UI components
- **React Router** - Client-side navigation
- **React Hook Form** - Form handling and validation
- **Zod** - Schema validation
- **Framer Motion** - Smooth animations
- **date-fns** - Date formatting

## 🎨 Design System

### Primary Color Scheme
- **Primary Color**: `#2BB6AF` (Teal/Cyan)
- **Hover State**: `#239a94` (Darker Teal)
- **Active State**: `#1a7a75` (Darkest Teal)
- **Background Tints**: `#E0F7F5` (Light Teal)

All buttons, links, badges, and interactive elements use the consistent primary color throughout the application.

### UI Components
- Responsive design (mobile-first approach)
- Modern card-based layouts
- Smooth transitions and animations
- Consistent spacing and typography
- Accessible color contrasts
- Loading states and error handling

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/me/` - Get current user
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/refresh/` - Refresh access token

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
- `GET /api/pets/` - List all pets (with filters)
- `GET /api/pets/<id>/` - Get pet details
- `POST /api/pets/lost/` - Report lost pet
- `POST /api/pets/found/` - Report found pet
- `POST /api/pets/<id>/workflow/` - Found pet workflow decisions
- `POST /api/pets/<id>/check-adoption/` - Check 15-day adoption rule
- `GET /api/pets/lost/<id>/match/` - Match lost pet
- `POST /api/pets/found/<id>/claim/` - Claim found pet
- `PUT /api/pets/<id>/` - Update pet information
- `DELETE /api/pets/<id>/` - Delete pet listing

### Medical
- `GET /api/health/camps/` - Get vaccination camps
- `POST /api/health/camps/register/` - Register for camp
- `GET /api/health/records/<pet_id>/` - Get pet medical records
- `POST /api/health/records/` - Create medical record

### Chats
- `GET /api/chats/` - Get user's chat rooms
- `POST /api/chats/create/` - Create chat room
- `GET /api/chats/<id>/messages/` - Get chat messages
- `POST /api/chats/<id>/messages/` - Send message
- `DELETE /api/chats/<id>/` - Delete chat room (admin)

### Admin
- `GET /api/admin/dashboard/` - Dashboard statistics
- `GET /api/admin/pending/` - Pending pet reports
- `GET /api/admin/adoptions/pending/` - Pending adoptions
- `GET /api/admin/chats/` - All chat rooms
- `POST /api/admin/pets/<id>/approve/` - Approve pet report
- `POST /api/admin/pets/<id>/reject/` - Reject pet report

### Notifications
- `GET /api/notifications/` - Get user notifications
- `GET /api/notifications/unread-count/` - Get unread count
- `POST /api/notifications/<id>/mark-read/` - Mark as read

## 📝 Environment Variables

### Backend (.env in backend/)
```env
DATABASE_URL=postgresql://user:pass@host/dbname
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

### Frontend (.env in Frontend/)
```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## 🗄️ Database Models

### Core Models
- **User**: Custom user model with roles (user, volunteer, shelter, admin)
- **Volunteer**: Volunteer profiles with shelter capacity and verification
- **Shelter**: Shelter management with capacity tracking and location
- **Pet**: Pet listings with lost/found/adoption status, images, and metadata
- **FeedingPoint**: Admin-managed feeding centers with location
- **FeedingRecord**: User feeding activities with photos and timestamps
- **ChatRoom**: Chat rooms for communication between users
- **Message**: Individual messages within chat rooms
- **Notification**: User notifications for various events
- **AdoptionApplication**: Adoption requests with status tracking
- **MedicalRecord**: Pet medical records and vaccination information

## 🔐 Authentication

- **JWT-based authentication** with access and refresh tokens
- **Access tokens**: 15-minute expiry
- **Refresh tokens**: 7-day expiry
- **Automatic token refresh** on 401 responses
- **Token storage**: localStorage with secure handling
- **Role-based access control**: User, Volunteer, Shelter, Admin roles

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first, works on all devices
- **Modern Interface**: Clean, intuitive design with consistent branding
- **Split-screen Auth**: Beautiful login/register pages with background images
- **Real-time Updates**: Live notifications and chat
- **Image Upload**: Support for multiple image formats
- **Advanced Search**: Filter pets by location, breed, age, status
- **Admin Dashboard**: Comprehensive statistics and management tools
- **Smooth Animations**: Framer Motion for delightful interactions
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: User-friendly error messages
- **Accessibility**: ARIA labels and keyboard navigation

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
Pillow>=10.0.0
```

### Frontend Dependencies
```
react>=18.0.0
typescript>=5.0.0
axios>=1.7.0
react-router-dom>=6.0.0
tailwindcss>=3.0.0
@radix-ui/react-* (shadcn/ui components)
framer-motion>=10.0.0
react-hook-form>=7.0.0
zod>=3.0.0
date-fns>=2.30.0
lucide-react (icons)
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
- Set environment variables in production
- Run migrations: `python manage.py migrate`
- Collect static files: `python manage.py collectstatic`
- Set up cron job for automated tasks (15-day adoption check)

### Frontend
- Build: `npm run build`
- Deploy to: Vercel, Netlify, or any static hosting
- Set `VITE_API_URL` environment variable to production API URL
- Configure CORS on backend for production domain

## 🔄 Automated Features

### 15-Day Adoption Rule
- Found pets automatically become eligible for adoption after 15 days
- Management command: `python manage.py auto_move_to_adoption`
- Can be scheduled as a cron job for daily execution
- Real-time check on pet detail view

### Real-time Notifications
- Server-Sent Events (SSE) for live updates
- Notifications for:
  - Pet matches
  - Adoption approvals
  - Volunteer/shelter verifications
  - Chat messages
  - Workflow updates

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on the repository.

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for pet rescue and adoption communities
- Inspired by the need to help pets find their way home

---

**Built with ❤️ for pet rescue and adoption**

*PetReunite - Helping pets find their way home*
