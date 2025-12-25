import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { LandingDataProvider } from "./contexts/LandingContext";
import { TopNav } from "./components/layout/TopNav";
import { Footer } from "./components/layout/Footer";
import { UserPageWrapper } from "./components/layout/UserPageWrapper";
import { UserProtectedRoute } from "./components/UserProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
// Common/Public pages
import Landing from "./pages/Landing";
import Policy from "./pages/Policy";
import Safety from "./pages/Safety";
import NotFound from "./pages/NotFound";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import RegisterAdmin from "./pages/auth/RegisterAdmin";
import ForgotPassword from "./pages/auth/ForgotPassword";

// User pages
import UserHome from "./pages/user/UserHome";
import Profile from "./pages/user/Profile";
import Chat from "./pages/user/Chat";
import ChatList from "./pages/user/ChatList";
import FoundPets from "./pages/user/pets/FoundPets";
import LostPets from "./pages/user/pets/LostPets";
import AdoptablePets from "./pages/user/pets/AdoptablePets";
import PetDetail from "./pages/user/pets/PetDetail";
import EditPet from "./pages/user/pets/EditPet";
import ReportFound from "./pages/user/pets/ReportFound";
import ReportLost from "./pages/user/pets/ReportLost";
import ShelterCapacity from "./pages/user/ShelterCapacity";
import BecomeVolunteer from "./pages/user/BecomeVolunteer";
import RegisterShelter from "./pages/user/RegisterShelter";
import FeedingPoints from "./pages/user/FeedingPoints";
import HomeCheckTracker from "./pages/user/HomeCheckTracker";
import NeighborhoodAlerts from "./pages/user/NeighborhoodAlerts";
import NGOVerification from "./pages/user/NGOVerification";
import HealthVaccination from "./pages/user/HealthVaccination";
import Notifications from "./pages/user/Notifications";

// Admin pages
import Admin from "./pages/admin/Admin";
import AdminFoundPets from "./pages/admin/AdminFoundPets";
import AdminLostPets from "./pages/admin/AdminLostPets";
import AdminAdopt from "./pages/admin/AdminAdopt";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminChats from "./pages/admin/AdminChats";
import AdminChatMonitor from "./pages/admin/AdminChatMonitor";
import AdminChatReadOnly from "./pages/admin/AdminChatReadOnly";
import AdminProfile from "./pages/admin/AdminProfile";
import AllPets from "./pages/admin/AllPets";
import AdminFeedingPoints from "./pages/admin/AdminFeedingPoints";
import AdminShelterLocations from "./pages/admin/AdminShelterLocations";
import AdminAllPets from "./pages/admin/AdminAllPets";
import AdminRoleRequests from "./pages/admin/AdminRoleRequests";
import AdminMedicalRecords from "./pages/admin/AdminMedicalRecords";
import AdminNotifications from "./pages/admin/AdminNotifications";
import CloudinaryTest from "./pages/admin/CloudinaryTest";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (data remains "fresh" for 5 mins)
      gcTime: 1000 * 60 * 30, // 30 minutes (keep inactive data in cache)
      refetchOnWindowFocus: false, // Don't refetch just because user clicked window
      retry: 1, // Only retry failed requests once
    },
  },
});

const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/auth/login';
  const isRegisterPage = location.pathname === '/auth/register';
  const isForgotPasswordPage = location.pathname === '/auth/forgot-password';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isPublicPage = location.pathname === '/' ||
    location.pathname.startsWith('/auth') ||
    location.pathname === '/policy' ||
    location.pathname === '/safety';

  return (
    <div className="flex min-h-screen flex-col">
      {/* TopNav for landing page and public pages */}
      {isPublicPage && !isLoginPage && !isRegisterPage && !isForgotPasswordPage && <TopNav />}
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/register-admin" element={<RegisterAdmin />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/safety" element={<Safety />} />

          {/* User Protected Routes */}
          <Route
            path="/home"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <UserHome />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <UserHome />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <Profile />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/pets/found"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <FoundPets />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/pets/lost"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <LostPets />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/pets/adopt"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <AdoptablePets />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/pets"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <AdoptablePets />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/pets/report-found"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <ReportFound />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/pets/report-lost"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <ReportLost />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/pets/new/found"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <ReportFound />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/pets/new/lost"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <ReportLost />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/pets/:id/edit"
            element={
              <AdminProtectedRoute>
                <UserPageWrapper>
                  <EditPet />
                </UserPageWrapper>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/pets/:id"
            element={
              <ProtectedRoute requireAuth={true} requireAdmin={false}>
                <UserPageWrapper>
                  <PetDetail />
                </UserPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chats"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <ChatList />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/chat/:roomId"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <Chat />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/chats/:roomId"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <Chat />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          {/* Community Features - User Protected */}
          <Route
            path="/shelter-capacity"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <ShelterCapacity />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/become-volunteer"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <BecomeVolunteer />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/register-shelter"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <RegisterShelter />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/feeding-points"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <FeedingPoints />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/home-check-tracker"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <HomeCheckTracker />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/neighborhood-alerts"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <NeighborhoodAlerts />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/ngo-verification"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <NGOVerification />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/health-vaccination"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <HealthVaccination />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <UserProtectedRoute>
                <UserPageWrapper>
                  <Notifications />
                </UserPageWrapper>
              </UserProtectedRoute>
            }
          />
          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <Admin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/found-pets"
            element={
              <AdminProtectedRoute>
                <AdminFoundPets />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/lost-pets"
            element={
              <AdminProtectedRoute>
                <AdminLostPets />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/adopt"
            element={
              <AdminProtectedRoute>
                <AdminAdopt />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute>
                <AdminUsers />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/chats"
            element={
              <AdminProtectedRoute>
                <AdminChats />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/chat/:roomId"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <Chat />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/chats/monitor/:roomId"
            element={
              <AdminProtectedRoute>
                <AdminChatMonitor />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/chats/view/:roomId"
            element={
              <AdminProtectedRoute>
                <AdminChatReadOnly />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminProtectedRoute>
                <AdminProfile />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/pets"
            element={
              <AdminProtectedRoute>
                <AllPets />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <AdminProtectedRoute>
                <AdminRequests />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/feeding-points"
            element={
              <AdminProtectedRoute>
                <AdminFeedingPoints />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/shelter-locations"
            element={
              <AdminProtectedRoute>
                <AdminShelterLocations />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/all-pets"
            element={
              <AdminProtectedRoute>
                <AdminAllPets />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/role-requests"
            element={
              <AdminProtectedRoute>
                <AdminRoleRequests />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/medical-records"
            element={
              <AdminProtectedRoute>
                <AdminMedicalRecords />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <AdminProtectedRoute>
                <AdminNotifications />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/cloudinary-test"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <CloudinaryTest />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isLoginPage && !isRegisterPage && !isForgotPasswordPage && !isAdminPage && isPublicPage && <Footer />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LandingDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </LandingDataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
