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
import { AdminRedirect } from "./components/AdminRedirect";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import RegisterAdmin from "./pages/auth/RegisterAdmin";
import UserHome from "./pages/UserHome";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminFoundPets from "./pages/admin/AdminFoundPets";
import AdminLostPets from "./pages/admin/AdminLostPets";
import AdminAdopt from "./pages/admin/AdminAdopt";
import FoundPets from "./pages/pets/FoundPets";
import LostPets from "./pages/pets/LostPets";
import AdoptablePets from "./pages/pets/AdoptablePets";
import PetDetail from "./pages/pets/PetDetail";
import ReportFound from "./pages/pets/ReportFound";
import ReportLost from "./pages/pets/ReportLost";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import Policy from "./pages/Policy";
import Safety from "./pages/Safety";
import NotFound from "./pages/NotFound";
import ShelterCapacity from "./pages/ShelterCapacity";
import BecomeVolunteer from "./pages/BecomeVolunteer";
import RegisterShelter from "./pages/RegisterShelter";
import FeedingPoints from "./pages/FeedingPoints";
import HomeCheckTracker from "./pages/HomeCheckTracker";
import NeighborhoodAlerts from "./pages/NeighborhoodAlerts";
import NGOVerification from "./pages/NGOVerification.tsx";
import HealthVaccination from "./pages/HealthVaccination";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminChats from "./pages/admin/AdminChats";
import AdminProfile from "./pages/admin/AdminProfile";
import AllPets from "./pages/admin/AllPets";
import AdminFeedingPoints from "./pages/admin/AdminFeedingPoints";
import AdminShelterLocations from "./pages/admin/AdminShelterLocations";
import AdminAllPets from "./pages/admin/AdminAllPets";
import AdminRoleRequests from "./pages/admin/AdminRoleRequests";
import AdminMedicalRecords from "./pages/admin/AdminMedicalRecords";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/auth/login';
  const isRegisterPage = location.pathname === '/auth/register';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isPublicPage = location.pathname === '/' || 
    location.pathname.startsWith('/auth') || 
    location.pathname === '/policy' || 
    location.pathname === '/safety';

  return (
    <div className="flex min-h-screen flex-col">
      {!isLoginPage && !isRegisterPage && !isAdminPage && isPublicPage && <TopNav />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/register-admin" element={<RegisterAdmin />} />
          <Route 
            path="/home" 
            element={
              <UserPageWrapper>
                <UserHome />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <UserPageWrapper>
                <Dashboard />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <UserPageWrapper>
                <Profile />
              </UserPageWrapper>
            } 
          />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/found-pets" element={<AdminFoundPets />} />
          <Route path="/admin/lost-pets" element={<AdminLostPets />} />
          <Route path="/admin/adopt" element={<AdminAdopt />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/chats" element={<AdminChats />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/pets" element={<AllPets />} />
          <Route 
            path="/pets/found" 
            element={
              <AdminRedirect adminPath="/admin/found-pets">
                <UserPageWrapper>
                  <FoundPets />
                </UserPageWrapper>
              </AdminRedirect>
            } 
          />
          <Route 
            path="/pets/lost" 
            element={
              <AdminRedirect adminPath="/admin/lost-pets">
                <UserPageWrapper>
                  <LostPets />
                </UserPageWrapper>
              </AdminRedirect>
            } 
          />
          <Route 
            path="/pets/adopt" 
            element={
              <AdminRedirect adminPath="/admin/adopt">
                <UserPageWrapper>
                  <AdoptablePets />
                </UserPageWrapper>
              </AdminRedirect>
            } 
          />
          {/* Main /pets route - shows all pets (adoptable) */}
          <Route 
            path="/pets" 
            element={
              <AdminRedirect adminPath="/admin/pets">
                <UserPageWrapper>
                  <AdoptablePets />
                </UserPageWrapper>
              </AdminRedirect>
            } 
          />
          <Route 
            path="/pets/report-found" 
            element={
              <UserPageWrapper>
                <ReportFound />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/pets/report-lost" 
            element={
              <UserPageWrapper>
                <ReportLost />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/pets/new/found" 
            element={
              <UserPageWrapper>
                <ReportFound />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/pets/new/lost" 
            element={
              <UserPageWrapper>
                <ReportLost />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/pets/:id" 
            element={
              <UserPageWrapper>
                <PetDetail />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/chats" 
            element={
              <UserPageWrapper>
                <ChatList />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/chat/:roomId" 
            element={
              <UserPageWrapper>
                <Chat />
              </UserPageWrapper>
            } 
          />
          <Route path="/policy" element={<Policy />} />
          <Route path="/safety" element={<Safety />} />
          {/* Community Features */}
          <Route 
            path="/shelter-capacity" 
            element={
              <UserPageWrapper>
                <ShelterCapacity />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/become-volunteer" 
            element={
              <UserPageWrapper>
                <BecomeVolunteer />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/register-shelter" 
            element={
              <UserPageWrapper>
                <RegisterShelter />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/feeding-points" 
            element={
              <UserPageWrapper>
                <FeedingPoints />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/home-check-tracker" 
            element={
              <UserPageWrapper>
                <HomeCheckTracker />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/neighborhood-alerts" 
            element={
              <UserPageWrapper>
                <NeighborhoodAlerts />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/ngo-verification" 
            element={
              <UserPageWrapper>
                <NGOVerification />
              </UserPageWrapper>
            } 
          />
          <Route 
            path="/health-vaccination" 
            element={
              <UserPageWrapper>
                <HealthVaccination />
              </UserPageWrapper>
            } 
          />
          {/* Admin Routes */}
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/admin/feeding-points" element={<AdminFeedingPoints />} />
          <Route path="/admin/shelter-locations" element={<AdminShelterLocations />} />
          <Route path="/admin/all-pets" element={<AdminAllPets />} />
          <Route path="/admin/role-requests" element={<AdminRoleRequests />} />
          <Route path="/admin/medical-records" element={<AdminMedicalRecords />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isLoginPage && !isRegisterPage && !isAdminPage && isPublicPage && <Footer />}
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
