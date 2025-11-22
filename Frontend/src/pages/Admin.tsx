import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, PawPrint, Heart, Search, Home, Shield, CheckCircle, X, AlertCircle, ArrowRight, MessageSquare, Clock, TrendingUp, Activity, BarChart3, Eye, Filter, Download, Calendar, Menu, Building2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { adminAPI, getImageUrl } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [pendingAdoptions, setPendingAdoptions] = useState([]);
  const [chatRequests, setChatRequests] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [chatStats, setChatStats] = useState<any>(null);
  const [shelterRegistrations, setShelterRegistrations] = useState<any[]>([]);
  const [shelterRegistrationsLoading, setShelterRegistrationsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptType, setAcceptType] = useState<'report' | 'adoption'>('report');
  const [verificationParams, setVerificationParams] = useState({
    verified_photos: false,
    verified_location: false,
    verified_contact: false,
    verified_identity: false,
    verified_adopter_identity: false,
    verified_home_check: false,
    verified_references: false,
    verified_financial_stability: false,
  });
  const [acceptNotes, setAcceptNotes] = useState('');
  const [adopterId, setAdopterId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [petsLoading, setPetsLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    // Only load dashboard data once on mount, not on every render
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, navigate]);

  // Load pets when "pets" tab is activated
  useEffect(() => {
    if (activeTab === 'pets' && pets.length === 0 && !petsLoading) {
      loadAllPets();
    }
  }, [activeTab]);

  // Load shelter registrations when "shelter-reg" tab is activated
  useEffect(() => {
    if (activeTab === 'shelter-reg' && shelterRegistrations.length === 0 && !shelterRegistrationsLoading) {
      loadShelterRegistrations();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashData, pendingData, adoptionData, chatRequestsData, chatsData, chatStatsData] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getPendingReports(),
        adminAPI.getPendingAdoptionRequests(),
        adminAPI.getAllChatRequests(),
        adminAPI.getAllChats(),
        adminAPI.getChatStats(),
      ]);
      setDashboardData(dashData);
      setPendingReports(pendingData);
      setPendingAdoptions(adoptionData);
      setChatRequests(chatRequestsData);
      setActiveChats(chatsData);
      setChatStats(chatStatsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllPets = async () => {
    try {
      setPetsLoading(true);
      const petsData = await adminAPI.getAllPets();
      setPets(Array.isArray(petsData) ? petsData : []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not load pets',
        variant: 'destructive',
      });
    } finally {
      setPetsLoading(false);
    }
  };

  const loadShelterRegistrations = async () => {
    try {
      setShelterRegistrationsLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_URL}/shelter-registrations/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch shelter registrations');
      const data = await response.json();
      setShelterRegistrations(Array.isArray(data.data) ? data.data : []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not load shelter registrations',
        variant: 'destructive',
      });
    } finally {
      setShelterRegistrationsLoading(false);
    }
  };

  const handleShelterAction = async (shelterId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_URL}/shelter-registrations/${shelterId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_notes: notes || '' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${action} shelter registration`);
      }
      toast({
        title: 'Success',
        description: `Shelter registration ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });
      loadShelterRegistrations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} shelter registration`,
        variant: 'destructive',
      });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
      toast({
        title: 'Success',
        description: 'User deactivated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to deactivate user',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptReport = async (reportId: string) => {
    setAcceptingId(reportId);
    setAcceptType('report');
    setShowAcceptModal(true);
  };

  const handleAcceptAdoption = async (adoptionId: string) => {
    setAcceptingId(adoptionId);
    setAcceptType('adoption');
    setShowAcceptModal(true);
  };

  const submitAcceptance = async () => {
    if (!acceptingId) return;

    try {
      if (acceptType === 'report') {
        await adminAPI.acceptReport(acceptingId, acceptNotes, verificationParams);
        setPendingReports(pendingReports.filter(r => r._id !== acceptingId));
        toast({
          title: 'Success',
          description: 'Report accepted and listed',
        });
      } else {
        await adminAPI.acceptAdoptionRequest(acceptingId, acceptNotes, verificationParams, adopterId || undefined);
        setPendingAdoptions(pendingAdoptions.filter(a => a._id !== acceptingId));
        toast({
          title: 'Success',
          description: 'Adoption request approved',
        });
      }
      
      setShowAcceptModal(false);
      setAcceptingId(null);
      setAcceptNotes('');
      setAdopterId('');
      setVerificationParams({
        verified_photos: false,
        verified_location: false,
        verified_contact: false,
        verified_identity: false,
        verified_adopter_identity: false,
        verified_home_check: false,
        verified_references: false,
        verified_financial_stability: false,
      });
      loadDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectReport = async (reportId: string) => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminAPI.rejectReport(reportId, rejectReason);
      setPendingReports(pendingReports.filter(r => r._id !== reportId));
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectReason('');
      toast({
        title: 'Success',
        description: 'Report rejected',
      });
      loadDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject report',
        variant: 'destructive',
      });
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <Shield className="h-16 w-16 mx-auto text-[#2E7D32] animate-pulse" />
            <div className="absolute inset-0 border-4 border-green-200 border-t-[#2E7D32] rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Admin Dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar - Desktop */}
      <div className="hidden lg:block">
        <AdminSidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col min-w-0 lg:ml-64">
        {/* Mobile Menu Toggle Button */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="p-8 space-y-8">
          {/* Admin Dashboard Header */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-[#4CAF50] flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
                    <p className="text-gray-600 text-sm mt-0.5">Platform Management & Monitoring Dashboard</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/30 px-3 py-1.5">
                  <Activity className="h-3.5 w-3.5 mr-1.5" />
                  Live System
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadDashboardData}
                  className="gap-2 border-gray-300 hover:bg-gray-50"
                >
                  <Activity className="h-4 w-4" />
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>

          {/* Critical Metrics - Priority Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pending Reports - High Priority */}
            <Card className="bg-white border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pending Reports</span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{dashboardData?.pending?.total || 0}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        {dashboardData?.pending?.found || 0} Found
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        {dashboardData?.pending?.lost || 0} Lost
                      </span>
                    </div>
                  </div>
                  <Link to="/admin/found-pets">
                    <Button variant="ghost" size="icon" className="text-orange-600 hover:bg-orange-50">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Pending Adoptions */}
            <Card className="bg-white border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Adoptions</span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{pendingAdoptions.length}</p>
                    <p className="text-xs text-gray-600 mt-2">Pending approval</p>
                  </div>
                  <Link to="/admin/adopt">
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Total Users */}
            <Card className="bg-white border-l-4 border-l-indigo-500 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-indigo-600" />
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Users</span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{dashboardData?.users?.total || 0}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                      <span>{dashboardData?.users?.regular || 0} Regular</span>
                      <span>•</span>
                      <span>{dashboardData?.users?.rescuers || 0} Rescuers</span>
                    </div>
                  </div>
                  <Link to="/admin/users">
                    <Button variant="ghost" size="icon" className="text-indigo-600 hover:bg-indigo-50">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Active Reports */}
            <Card className="bg-white border-l-4 border-l-[#4CAF50] shadow-lg hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <PawPrint className="h-5 w-5 text-[#4CAF50]" />
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Active Reports</span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{dashboardData?.active?.total || 0}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                      <span>{dashboardData?.active?.found || 0} Found</span>
                      <span>•</span>
                      <span>{dashboardData?.active?.lost || 0} Lost</span>
                    </div>
                  </div>
                  <Link to="/admin/found-pets">
                    <Button variant="ghost" size="icon" className="text-[#4CAF50] hover:bg-[#4CAF50]/10">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status & Quick Access */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Overview */}
            <Card className="lg:col-span-2 bg-white shadow-lg">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">System Overview</CardTitle>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.pets?.found || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Found Pets</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.pets?.lost || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Lost Pets</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.pets?.adoptable || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Adoptable</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.matched || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Matched</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white shadow-lg">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <Link to="/admin/found-pets">
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 hover:bg-[#4CAF50]/10 hover:border-[#4CAF50]">
                    <PawPrint className="h-5 w-5 text-[#4CAF50]" />
                    <div className="text-left">
                      <div className="font-semibold">Found Pets</div>
                      <div className="text-xs text-gray-500">{dashboardData?.pending?.found || 0} pending</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/admin/lost-pets">
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 hover:bg-[#4CAF50]/10 hover:border-[#4CAF50]">
                    <Search className="h-5 w-5 text-[#4CAF50]" />
                    <div className="text-left">
                      <div className="font-semibold">Lost Pets</div>
                      <div className="text-xs text-gray-500">{dashboardData?.pending?.lost || 0} pending</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/admin/requests">
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 hover:bg-[#4CAF50]/10 hover:border-[#4CAF50]">
                    <Shield className="h-5 w-5 text-[#4CAF50]" />
                    <div className="text-left">
                      <div className="font-semibold">Manage Requests</div>
                      <div className="text-xs text-gray-500">All pending requests</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/admin/users">
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 hover:bg-[#4CAF50]/10 hover:border-[#4CAF50]">
                    <Users className="h-5 w-5 text-[#4CAF50]" />
                    <div className="text-left">
                      <div className="font-semibold">User Management</div>
                      <div className="text-xs text-gray-500">{dashboardData?.users?.total || 0} total users</div>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Management Center - All Management Functions */}
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Management Center</CardTitle>
                  <CardDescription className="text-base mt-1">Comprehensive platform management and monitoring</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
                    <Activity className="h-3.5 w-3.5 mr-1.5" />
                    Live Data
                  </Badge>
                </div>
              </div>
            </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-9 mb-6 h-auto p-1 bg-gray-100">
                <TabsTrigger value="overview" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="pending-reports" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Reports</span>
                  {(dashboardData?.pending?.total || 0) > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{dashboardData.pending.total}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending-adoptions" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Adoptions</span>
                  {pendingAdoptions.length > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{pendingAdoptions.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="chat-requests" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Chat Requests</span>
                  {(chatStats?.pending_requests || 0) > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{chatStats?.pending_requests || 0}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active-chats" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Active Chats</span>
                  {(chatStats?.active_chats || 0) > 0 && (
                    <Badge variant="default" className="ml-1 text-xs px-1.5 py-0">{chatStats?.active_chats || 0}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="pets" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                  <PawPrint className="h-4 w-4" />
                  <span className="hidden sm:inline">All Pets</span>
                </TabsTrigger>
                <TabsTrigger value="shelter-reg" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Shelter Reg.</span>
                  {shelterRegistrations.filter((s: any) => s.status === 'pending').length > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                      {shelterRegistrations.filter((s: any) => s.status === 'pending').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="role-requests" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Role Requests</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab - Platform Statistics */}
              <TabsContent value="overview" className="space-y-6">
                {/* Platform Statistics */}
                {dashboardData && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Platform Statistics</h3>
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Found Pets</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardData.pets?.found || 0}</p>
                            </div>
                            <Heart className="h-8 w-8 text-emerald-600 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Lost Pets</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardData.pets?.lost || 0}</p>
                            </div>
                            <Search className="h-8 w-8 text-amber-600 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Adoptable</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardData.pets?.adoptable || 0}</p>
                            </div>
                            <Home className="h-8 w-8 text-cyan-600 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Matched</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardData.matched || 0}</p>
                            </div>
                            <Heart className="h-8 w-8 text-pink-600 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

              </TabsContent>

              {/* Pending Reports Tab */}
              <TabsContent value="pending-reports" className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by breed, species, location, or reporter name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">All Types</option>
                        <option value="found">Found</option>
                        <option value="lost">Lost</option>
                      </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('all');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {(() => {
                  const filtered = pendingReports.filter((report: any) => {
                    const matchesSearch = !searchTerm || 
                      report.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      report.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      report.last_seen_or_found_location_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      report.submitted_by?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      report.submitted_by?.email?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesType = typeFilter === 'all' || report.report_type === typeFilter;
                    return matchesSearch && matchesType;
                  });

                  return filtered.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm || typeFilter !== 'all' ? 'No Results Found' : 'All Clear!'}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm || typeFilter !== 'all' 
                          ? 'Try adjusting your search or filters'
                          : 'No pending reports. All reports have been verified.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 text-sm text-gray-600">
                        Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{pendingReports.length}</span> pending reports
                      </div>
                      <div className="space-y-4">
                        {filtered.map((report: any) => (
                          <Card key={report._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <Badge variant={report.report_type === 'found' ? 'default' : 'secondary'} className="text-xs">
                                      {report.report_type.toUpperCase()}
                                    </Badge>
                                    <h3 className="font-semibold text-lg text-gray-900">
                                      {report.species} - {report.breed || 'Mixed'}
                                    </h3>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <span className="text-gray-500">Description:</span>
                                      <p className="text-gray-900 font-medium">{report.distinguishing_marks}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Location:</span>
                                      <p className="text-gray-900 font-medium">
                                        {report.last_seen_or_found_location_text}
                                        {report.last_seen_or_found_pincode && ` (${report.last_seen_or_found_pincode})`}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Date:</span>
                                      <p className="text-gray-900 font-medium">
                                        {format(new Date(report.last_seen_or_found_date), 'MMM dd, yyyy')}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Reported by:</span>
                                      <p className="text-gray-900 font-medium">
                                        {report.submitted_by?.name} ({report.submitted_by?.email})
                                      </p>
                                    </div>
                                  </div>
                                  {report.photos && report.photos.length > 0 && (
                                    <div className="mt-3 flex gap-2">
                                      {report.photos.slice(0, 3).map((photo: any, idx: number) => {
                                        const photoPath = typeof photo === 'string' ? photo : photo.url;
                                        const photoUrl = getImageUrl(photoPath) || 'https://via.placeholder.com/80';
                                        return (
                                          <img
                                            key={idx}
                                            src={photoUrl}
                                            alt={`Pet ${idx + 1}`}
                                            className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                                          />
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 gap-2"
                                    onClick={() => handleAcceptReport(report._id)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="gap-2"
                                    onClick={() => {
                                      setRejectingId(report._id);
                                      setShowRejectModal(true);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </TabsContent>

              {/* Pending Adoptions Tab */}
              <TabsContent value="pending-adoptions" className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by breed, species, location, or adopter name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear
                  </Button>
                </div>

                {(() => {
                  const filtered = pendingAdoptions.filter((adoption: any) => {
                    return !searchTerm || 
                      adoption.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      adoption.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      adoption.last_seen_or_found_location_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      adoption.submitted_by?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      adoption.submitted_by?.email?.toLowerCase().includes(searchTerm.toLowerCase());
                  });

                  return filtered.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm ? 'No Results Found' : 'All Clear!'}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'Try adjusting your search' : 'No pending adoption requests.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 text-sm text-gray-600">
                        Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{pendingAdoptions.length}</span> pending adoptions
                      </div>
                      <div className="space-y-4">
                        {filtered.map((adoption: any) => (
                          <Card key={adoption._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <Badge variant="default" className="text-xs">ADOPTION</Badge>
                                    <h3 className="font-semibold text-lg text-gray-900">
                                      {adoption.species} - {adoption.breed || 'Mixed'}
                                    </h3>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <span className="text-gray-500">Description:</span>
                                      <p className="text-gray-900 font-medium">{adoption.distinguishing_marks}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Location:</span>
                                      <p className="text-gray-900 font-medium">{adoption.last_seen_or_found_location_text || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Requested by:</span>
                                      <p className="text-gray-900 font-medium">
                                        {adoption.submitted_by?.name} ({adoption.submitted_by?.email})
                                      </p>
                                    </div>
                                  </div>
                                  {adoption.photos && adoption.photos.length > 0 && (
                                    <div className="mt-3 flex gap-2">
                                      {adoption.photos.slice(0, 3).map((photo: any, idx: number) => {
                                        const photoPath = typeof photo === 'string' ? photo : photo.url;
                                        const photoUrl = getImageUrl(photoPath) || 'https://via.placeholder.com/80';
                                        return (
                                          <img
                                            key={idx}
                                            src={photoUrl}
                                            alt={`Pet ${idx + 1}`}
                                            className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                                          />
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 gap-2"
                                  onClick={() => handleAcceptAdoption(adoption._id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Accept
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </TabsContent>

              {/* Chat Requests Tab */}
              <TabsContent value="chat-requests" className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by pet ID, requester ID, or message..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Types</option>
                      <option value="adoption">Adoption</option>
                      <option value="claim">Claim</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('all');
                        setStatusFilter('all');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {(() => {
                  const filtered = chatRequests.filter((req: any) => {
                    const matchesSearch = !searchTerm || 
                      req.petId?.toString().includes(searchTerm) ||
                      req.requesterId?.toString().includes(searchTerm) ||
                      req.message?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesType = typeFilter === 'all' || req.type === typeFilter;
                    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
                    return matchesSearch && matchesType && matchesStatus;
                  });

                  const pendingFiltered = filtered.filter((req: any) => req.status === 'pending');

                  return pendingFiltered.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? 'No Results Found' : 'No Pending Requests'}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                          ? 'Try adjusting your search or filters'
                          : 'All chat requests have been processed.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 text-sm text-gray-600">
                        Showing <span className="font-semibold">{pendingFiltered.length}</span> pending requests
                        {filtered.length !== pendingFiltered.length && (
                          <span> (Total filtered: {filtered.length})</span>
                        )}
                      </div>
                      <div className="space-y-4">
                        {pendingFiltered.map((request: any) => (
                        <Card key={request.id || request._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge variant={request.type === 'adoption' ? 'default' : 'secondary'}>
                                    {request.type === 'adoption' ? 'ADOPTION' : 'CLAIM'}
                                  </Badge>
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-gray-500">Pet ID:</span>
                                    <span className="text-gray-900 font-medium ml-2">{request.petId}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Requester ID:</span>
                                    <span className="text-gray-900 font-medium ml-2">{request.requesterId}</span>
                                  </div>
                                  {request.message && (
                                    <div className="bg-gray-50 rounded-lg p-3 mt-2">
                                      <p className="text-gray-700">
                                        <span className="font-medium">Message:</span> {request.message}
                                      </p>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    Requested: {format(new Date(request.createdAt || Date.now()), 'MMM d, yyyy HH:mm')}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 gap-2"
                                  onClick={async () => {
                                    try {
                                      await adminAPI.respondToChatRequest(request.id || request._id, true);
                                      toast({
                                        title: 'Success',
                                        description: 'Chat request approved',
                                      });
                                      loadDashboardData();
                                    } catch (error: any) {
                                      toast({
                                        title: 'Error',
                                        description: error.message || 'Failed to approve request',
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-2"
                                  onClick={async () => {
                                    try {
                                      await adminAPI.respondToChatRequest(request.id || request._id, false);
                                      toast({
                                        title: 'Success',
                                        description: 'Chat request rejected',
                                      });
                                      loadDashboardData();
                                    } catch (error: any) {
                                      toast({
                                        title: 'Error',
                                        description: error.message || 'Failed to reject request',
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </TabsContent>

              {/* Active Chats Tab */}
              <TabsContent value="active-chats" className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by room ID, pet ID, or participant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Types</option>
                      <option value="adoption">Adoption</option>
                      <option value="claim">Claim</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('all');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {(() => {
                  const filtered = activeChats.filter((chat: any) => {
                    const matchesSearch = !searchTerm || 
                      chat.roomId?.toString().includes(searchTerm) ||
                      chat.petId?.toString().includes(searchTerm) ||
                      chat.participants?.some((p: any) => p.toString().includes(searchTerm));
                    const matchesType = typeFilter === 'all' || chat.type === typeFilter;
                    return matchesSearch && matchesType;
                  });

                  return filtered.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm || typeFilter !== 'all' ? 'No Results Found' : 'No Active Chats'}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm || typeFilter !== 'all' 
                          ? 'Try adjusting your search or filters'
                          : 'There are no active chat conversations at the moment.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 text-sm text-gray-600">
                        Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{activeChats.length}</span> active chats
                      </div>
                      <div className="space-y-4">
                        {filtered.map((chat: any) => (
                      <Card key={chat.roomId || chat._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant={chat.type === 'adoption' ? 'default' : 'secondary'}>
                                  {chat.type === 'adoption' ? 'ADOPTION' : 'CLAIM'}
                                </Badge>
                                <Badge variant="default" className="bg-green-50 text-green-700 border-green-300">
                                  Active
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Room ID:</span>
                                  <span className="text-gray-900 font-medium ml-2">{chat.roomId || chat._id}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Pet ID:</span>
                                  <span className="text-gray-900 font-medium ml-2">{chat.petId}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Participants:</span>
                                  <span className="text-gray-900 font-medium ml-2">{chat.participants?.join(', ') || 'N/A'}</span>
                                </div>
                                {chat.messages && chat.messages.length > 0 && (
                                  <div>
                                    <span className="text-gray-500">Messages:</span>
                                    <span className="text-gray-900 font-medium ml-2">{chat.messages.length}</span>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      Last: {chat.messages[chat.messages.length - 1]?.text || 'No messages yet'}
                                    </p>
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">
                                  Created: {format(new Date(chat.createdAt || Date.now()), 'MMM d, yyyy HH:mm')}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() => navigate(`/chat/${chat.roomId || chat._id}`)}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={async () => {
                                  try {
                                    const roomData = await adminAPI.getChatRoom(chat.roomId || chat._id);
                                    toast({
                                      title: 'Chat Details',
                                      description: `Room has ${roomData.messages?.length || 0} messages`,
                                    });
                                  } catch (error) {
                                    toast({
                                      title: 'Error',
                                      description: 'Could not load chat details',
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                              >
                                <Shield className="h-4 w-4" />
                                Monitor
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                      </div>
                    </>
                  );
                })()}
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name, email, or role..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="user">User</option>
                      <option value="rescuer">Rescuer</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const usersData = await adminAPI.getAllUsers();
                          setUsers(usersData);
                          setSearchTerm('');
                          setStatusFilter('all');
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: 'Could not load users',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      Load Users
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {(() => {
                  const filtered = users.filter((u: any) => {
                    const matchesSearch = !searchTerm || 
                      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesRole = statusFilter === 'all' || u.role === statusFilter;
                    return matchesSearch && matchesRole;
                  });

                  return (
                    <>
                      <div className="mb-4 text-sm text-gray-600">
                        {users.length > 0 ? (
                          <>Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{users.length}</span> users</>
                        ) : (
                          <>Click "Load Users" to view all users</>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                          <TableBody>
                            {filtered.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                  {searchTerm || statusFilter !== 'all' ? 'No users match your search' : 'No users found. Click "Load Users" to fetch data.'}
                                </TableCell>
                              </TableRow>
                            ) : (
                              filtered.map((u: any) => (
                          <TableRow key={u._id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <Badge variant={u.role === 'admin' ? 'default' : u.role === 'rescuer' ? 'secondary' : 'outline'}>
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {format(new Date(u.createdAt), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {u.role !== 'admin' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeactivateUser(u._id)}
                                >
                                  Deactivate
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  );
                })()}
              </TabsContent>

              {/* Pets Tab */}
              <TabsContent value="pets" className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by breed, species, location, or status..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Types</option>
                      <option value="found">Found</option>
                      <option value="lost">Lost</option>
                      <option value="adoption">Adoption</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Status</option>
                      <option value="Pending Verification">Pending</option>
                      <option value="Listed Found">Listed Found</option>
                      <option value="Listed Lost">Listed Lost</option>
                      <option value="Matched">Matched</option>
                      <option value="Reunited">Reunited</option>
                      <option value="Available for Adoption">Available for Adoption</option>
                      <option value="Adopted">Adopted</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAllPets}
                      disabled={petsLoading}
                      className="gap-2"
                    >
                      {petsLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4" />
                          Refresh
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('all');
                        setStatusFilter('all');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {(() => {
                  if (petsLoading) {
                    return (
                      <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">Loading all pets...</p>
                      </div>
                    );
                  }

                  const filtered = pets.filter((p: any) => {
                    const matchesSearch = !searchTerm || 
                      p.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.last_seen_or_found_location_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.name?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesType = typeFilter === 'all' || p.report_type === typeFilter || p.type === typeFilter;
                    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
                    return matchesSearch && matchesType && matchesStatus;
                  });

                  return (
                    <>
                      <div className="mb-4 text-sm text-gray-600">
                        {pets.length > 0 ? (
                          <>Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{pets.length}</span> pets</>
                        ) : (
                          <>No pets found. Click "Refresh" to load all pets.</>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pet Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Breed</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                          <TableBody>
                            {filtered.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                                    ? 'No pets match your search' 
                                    : pets.length === 0 
                                    ? 'No pets found. Click "Refresh" to load all pets.' 
                                    : 'No pets match the current filters.'}
                                </TableCell>
                              </TableRow>
                            ) : (
                              filtered.map((p: any) => (
                          <TableRow key={p._id}>
                            <TableCell className="font-medium">{p.name || p.species || 'Unnamed'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                p.report_type === 'found' || p.type === 'found' ? 'default' :
                                p.report_type === 'lost' || p.type === 'lost' ? 'secondary' : 'outline'
                              }>
                                {p.report_type || p.type || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>{p.breed || p.species || 'Unknown'}</TableCell>
                            <TableCell className="text-sm">{p.last_seen_or_found_location_text || p.location?.city || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                p.status === 'Listed Found' || p.status === 'Listed Lost' ? 'default' :
                                p.status === 'Pending Verification' ? 'destructive' : 'outline'
                              }>
                                {p.status || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {p.date_submitted || p.createdAt 
                                ? format(new Date(p.date_submitted || p.createdAt), 'MMM dd, yyyy')
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/pets/${p._id}`)}
                                className="gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                );
              })()}
              </TabsContent>

              {/* Shelter Registrations Tab */}
              <TabsContent value="shelter-reg" className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by shelter name, owner, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadShelterRegistrations}
                      disabled={shelterRegistrationsLoading}
                      className="gap-2"
                    >
                      {shelterRegistrationsLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4" />
                          Refresh
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {shelterRegistrationsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading shelter registrations...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const filtered = shelterRegistrations.filter((s: any) => {
                        const matchesSearch = !searchTerm || 
                          s.shelter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.location?.address?.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
                        return matchesSearch && matchesStatus;
                      });

                      return (
                        <>
                          <div className="mb-4 text-sm text-gray-600">
                            Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{shelterRegistrations.length}</span> shelter registrations
                          </div>
                          {filtered.length === 0 ? (
                            <Card>
                              <CardContent className="py-12 text-center">
                                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Shelter Registrations</h3>
                                <p className="text-gray-600">
                                  {searchTerm || statusFilter !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'No shelter registrations found.'}
                                </p>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="space-y-4">
                              {filtered.map((shelter: any) => (
                                <Card key={shelter._id}>
                                  <CardHeader>
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                                          <Building2 className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                          <CardTitle className="text-lg">{shelter.shelter_name}</CardTitle>
                                          <CardDescription>
                                            {shelter.user?.name || 'Unknown'} • {shelter.user?.email || 'N/A'}
                                          </CardDescription>
                                        </div>
                                      </div>
                                      <Badge
                                        variant={
                                          shelter.status === 'pending' ? 'default' :
                                          shelter.status === 'approved' ? 'default' :
                                          'destructive'
                                        }
                                        className={
                                          shelter.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                          shelter.status === 'approved' ? 'bg-green-100 text-green-700' :
                                          'bg-red-100 text-red-700'
                                        }
                                      >
                                        {shelter.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                        {shelter.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                        {shelter.status === 'rejected' && <X className="h-3 w-3 mr-1" />}
                                        {shelter.status || 'Pending'}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Location</p>
                                        <p className="text-sm text-gray-600">
                                          {shelter.location?.city || 'N/A'}, {shelter.location?.state || ''}
                                        </p>
                                        <p className="text-xs text-gray-500">{shelter.location?.pincode || ''}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Capacity</p>
                                        <p className="text-sm text-gray-600">{shelter.capacity || shelter.total_capacity || 'N/A'} animals</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Area</p>
                                        <p className="text-sm text-gray-600">{shelter.area_sqft || 'N/A'} sq ft</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Accepts Feeding</p>
                                        <p className="text-sm text-gray-600">{shelter.accepts_feeding_data ? 'Yes' : 'No'}</p>
                                      </div>
                                    </div>
                                    {shelter.facilities && shelter.facilities.length > 0 && (
                                      <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Facilities</p>
                                        <div className="flex flex-wrap gap-2">
                                          {shelter.facilities.map((facility: string, idx: number) => (
                                            <Badge key={idx} variant="outline">{facility}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {shelter.contact_info && (
                                      <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Contact</p>
                                        <p className="text-sm text-gray-600">
                                          {shelter.contact_info.phone || shelter.user?.phone || 'N/A'}
                                        </p>
                                      </div>
                                    )}
                                    {shelter.status === 'pending' && (
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={() => {
                                            const notes = prompt('Add optional notes for approval:');
                                            if (notes !== null) {
                                              handleShelterAction(shelter._id, 'approve', notes);
                                            }
                                          }}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => {
                                            const reason = prompt('Please provide a reason for rejection:');
                                            if (reason && reason.trim()) {
                                              handleShelterAction(shelter._id, 'reject', reason);
                                            }
                                          }}
                                        >
                                          <X className="mr-2 h-4 w-4" />
                                          Reject
                                        </Button>
                                      </div>
                                    )}
                                    {shelter.admin_notes && (
                                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Admin Notes</p>
                                        <p className="text-sm text-gray-600">{shelter.admin_notes}</p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </TabsContent>

              {/* Role Requests Tab */}
              <TabsContent value="role-requests" className="space-y-4">
                <div className="text-center py-12">
                  <UserPlus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Role Requests Management</h3>
                  <p className="text-gray-600 mb-4">
                    Manage volunteer role requests (rescuer, feeder, transporter)
                  </p>
                  <Button onClick={() => navigate('/admin/requests')} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Go to Manage Requests
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle>Reject Report</CardTitle>
              <CardDescription>Provide a reason for rejection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Rejection Reason *</Label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this report is being rejected..."
                  className="w-full border rounded-md p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent mt-2"
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRejectReport(rejectingId!)}
                >
                  Reject Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Verification/Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader>
              <CardTitle>
                {acceptType === 'report' ? 'Accept & Verify Report' : 'Accept & Verify Adoption Request'}
              </CardTitle>
              <CardDescription>
                {acceptType === 'report' 
                  ? 'Verify at least 2 parameters before accepting (photos, location, contact, identity)'
                  : 'Verify at least 3 parameters before accepting (identity, home check, references, financial stability)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Verification Parameters</Label>
                
                {acceptType === 'report' ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_photos"
                        checked={verificationParams.verified_photos}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_photos: !!checked })
                        }
                      />
                      <Label htmlFor="verified_photos" className="cursor-pointer">
                        Photos Verified (Pet photos are clear and match description)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_location"
                        checked={verificationParams.verified_location}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_location: !!checked })
                        }
                      />
                      <Label htmlFor="verified_location" className="cursor-pointer">
                        Location Verified (Location details are accurate)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_contact"
                        checked={verificationParams.verified_contact}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_contact: !!checked })
                        }
                      />
                      <Label htmlFor="verified_contact" className="cursor-pointer">
                        Contact Verified (Reporter contact information is valid)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_identity"
                        checked={verificationParams.verified_identity}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_identity: !!checked })
                        }
                      />
                      <Label htmlFor="verified_identity" className="cursor-pointer">
                        Identity Verified (Reporter identity is confirmed)
                      </Label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_adopter_identity"
                        checked={verificationParams.verified_adopter_identity}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_adopter_identity: !!checked })
                        }
                      />
                      <Label htmlFor="verified_adopter_identity" className="cursor-pointer">
                        Adopter Identity Verified
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_home_check"
                        checked={verificationParams.verified_home_check}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_home_check: !!checked })
                        }
                      />
                      <Label htmlFor="verified_home_check" className="cursor-pointer">
                        Home Check Completed
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_references"
                        checked={verificationParams.verified_references}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_references: !!checked })
                        }
                      />
                      <Label htmlFor="verified_references" className="cursor-pointer">
                        References Verified
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_financial_stability"
                        checked={verificationParams.verified_financial_stability}
                        onCheckedChange={(checked) =>
                          setVerificationParams({ ...verificationParams, verified_financial_stability: !!checked })
                        }
                      />
                      <Label htmlFor="verified_financial_stability" className="cursor-pointer">
                        Financial Stability Confirmed
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adopter_id">Adopter User ID (Optional)</Label>
                      <Input
                        id="adopter_id"
                        value={adopterId}
                        onChange={(e) => setAdopterId(e.target.value)}
                        placeholder="Enter adopter's user ID"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accept_notes">Additional Notes (Optional)</Label>
                <textarea
                  id="accept_notes"
                  value={acceptNotes}
                  onChange={(e) => setAcceptNotes(e.target.value)}
                  placeholder="Add any additional verification notes..."
                  className="w-full border rounded-md p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAcceptModal(false);
                    setAcceptNotes('');
                    setAdopterId('');
                    setVerificationParams({
                      verified_photos: false,
                      verified_location: false,
                      verified_contact: false,
                      verified_identity: false,
                      verified_adopter_identity: false,
                      verified_home_check: false,
                      verified_references: false,
                      verified_financial_stability: false,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={submitAcceptance} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept & Verify
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
          </div>
        </main>
      </div>
    </div>
  );
}
