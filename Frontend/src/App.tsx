import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { TopNav } from "./components/layout/TopNav";
import { Footer } from "./components/layout/Footer";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import UserHome from "./pages/UserHome";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import FoundPets from "./pages/pets/FoundPets";
import LostPets from "./pages/pets/LostPets";
import AdoptablePets from "./pages/pets/AdoptablePets";
import PetDetail from "./pages/pets/PetDetail";
import ReportFound from "./pages/pets/ReportFound";
import ReportLost from "./pages/pets/ReportLost";
import Chat from "./pages/Chat";
import Policy from "./pages/Policy";
import Safety from "./pages/Safety";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex min-h-screen flex-col">
            <TopNav />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/home" element={<UserHome />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/pets/found" element={<FoundPets />} />
                <Route path="/pets/lost" element={<LostPets />} />
                <Route path="/pets/adopt" element={<AdoptablePets />} />
                <Route path="/pets/new/found" element={<ReportFound />} />
                <Route path="/pets/new/lost" element={<ReportLost />} />
                <Route path="/pets/:id" element={<PetDetail />} />
                <Route path="/chat/:roomId" element={<Chat />} />
                <Route path="/policy" element={<Policy />} />
                <Route path="/safety" element={<Safety />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
