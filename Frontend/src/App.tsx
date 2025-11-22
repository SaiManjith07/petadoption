import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { TopNav } from "./components/layout/TopNav";
import { Footer } from "./components/layout/Footer";
import { AdminRedirect } from "./components/AdminRedirect";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
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
import AdminRequests from "./pages/admin/AdminRequests";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminChats from "./pages/admin/AdminChats";
import AdminProfile from "./pages/admin/AdminProfile";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/auth/login';
  const isRegisterPage = location.pathname === '/auth/register';
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen flex-col">
      {!isLoginPage && !isRegisterPage && <TopNav />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/home" element={<UserHome />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/found-pets" element={<AdminFoundPets />} />
          <Route path="/admin/lost-pets" element={<AdminLostPets />} />
          <Route path="/admin/adopt" element={<AdminAdopt />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/chats" element={<AdminChats />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route 
            path="/pets/found" 
            element={
              <AdminRedirect adminPath="/admin/found-pets">
                <FoundPets />
              </AdminRedirect>
            } 
          />
          <Route 
            path="/pets/lost" 
            element={
              <AdminRedirect adminPath="/admin/lost-pets">
                <LostPets />
              </AdminRedirect>
            } 
          />
          <Route 
            path="/pets/adopt" 
            element={
              <AdminRedirect adminPath="/admin/adopt">
                <AdoptablePets />
              </AdminRedirect>
            } 
          />
          <Route path="/pets/new/found" element={<ReportFound />} />
          <Route path="/pets/new/lost" element={<ReportLost />} />
          <Route path="/pets/:id" element={<PetDetail />} />
          <Route path="/chats" element={<ChatList />} />
          <Route path="/chat/:roomId" element={<Chat />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/safety" element={<Safety />} />
          {/* Community Features */}
          <Route path="/shelter-capacity" element={<ShelterCapacity />} />
          <Route path="/become-volunteer" element={<BecomeVolunteer />} />
          <Route path="/register-shelter" element={<RegisterShelter />} />
          <Route path="/feeding-points" element={<FeedingPoints />} />
          <Route path="/home-check-tracker" element={<HomeCheckTracker />} />
          <Route path="/neighborhood-alerts" element={<NeighborhoodAlerts />} />
          <Route path="/ngo-verification" element={<NGOVerification />} />
          {/* Admin Routes */}
          <Route path="/admin/requests" element={<AdminRequests />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isLoginPage && !isRegisterPage && !isAdminPage && <Footer />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
