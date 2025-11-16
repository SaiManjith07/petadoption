import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, PawPrint, Heart, Search, Home, Shield, CheckCircle, X, AlertCircle, ArrowRight, MessageSquare, Clock, TrendingUp, Activity, BarChart3, Eye, Filter } from 'lucide-react';
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

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadDashboardData();
  }, [isAdmin, navigate]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <Shield className="h-16 w-16 mx-auto text-green-600 animate-pulse" />
            <div className="absolute inset-0 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Admin Dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 mt-0.5">Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="px-4 py-1.5 bg-green-100 text-green-700 border-green-200 font-semibold">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Administrator
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboardData}
                className="gap-2"
              >
                <Activity className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pending Reports */}
          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Reports</CardTitle>
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardData?.pending?.total || 0}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                <span>{dashboardData?.pending?.lost || 0} lost • {dashboardData?.pending?.found || 0} found</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Users */}
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardData?.users?.total || 0}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                <span>{dashboardData?.users?.regular || 0} regular • {dashboardData?.users?.rescuers || 0} rescuers</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Reports */}
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Active Reports</CardTitle>
                <PawPrint className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardData?.active?.total || 0}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                <span>{dashboardData?.active?.found || 0} found • {dashboardData?.active?.lost || 0} lost</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Chats */}
          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Active Chats</CardTitle>
                <MessageSquare className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{chatStats?.active_chats || 0}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                <span>{chatStats?.pending_requests || 0} pending requests</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/admin/found-pets">
              <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-500 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PawPrint className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="mt-4 text-lg font-semibold">Found Pets</CardTitle>
                  <CardDescription>Manage and verify found pet reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600">{dashboardData?.pending?.found || 0}</span>
                    <span className="text-sm text-gray-500">pending verification</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {dashboardData?.active?.found || 0} active reports
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/lost-pets">
              <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Search className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="mt-4 text-lg font-semibold">Lost Pets</CardTitle>
                  <CardDescription>Manage and verify lost pet reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-orange-600">{dashboardData?.pending?.lost || 0}</span>
                    <span className="text-sm text-gray-500">pending verification</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {dashboardData?.active?.lost || 0} active reports
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/adopt">
              <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Home className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="mt-4 text-lg font-semibold">Adoption Requests</CardTitle>
                  <CardDescription>Verify and approve adoption requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-600">{pendingAdoptions.length}</span>
                    <span className="text-sm text-gray-500">pending approval</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {dashboardData?.pets?.adoptable || 0} available for adoption
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>


        {/* Management Center - All Management Functions */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Management Center</CardTitle>
                <CardDescription className="text-base mt-1">Comprehensive platform management and monitoring</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1">
                  <Activity className="h-3.5 w-3.5 mr-1.5" />
                  Live Data
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 mb-6 h-auto p-1 bg-gray-100">
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
              </TabsList>

              {/* Overview Tab - Statistics and Chat Management */}
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

                {/* Chat Management Overview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Chat Management</h3>
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                  <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-orange-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-gray-700">Pending</span>
                          </div>
                          <p className="text-2xl font-bold text-orange-600">{chatStats?.pending_requests || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Active</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">{chatStats?.active_chats || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Approved</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">{chatStats?.approved_requests || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-red-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <X className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-gray-700">Rejected</span>
                          </div>
                          <p className="text-2xl font-bold text-red-600">{chatStats?.rejected_requests || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const petsData = await adminAPI.getAllPets();
                          setPets(petsData);
                          setSearchTerm('');
                          setTypeFilter('all');
                          setStatusFilter('all');
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: 'Could not load pets',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      Load Pets
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
                  const filtered = pets.filter((p: any) => {
                    const matchesSearch = !searchTerm || 
                      p.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.status?.toLowerCase().includes(searchTerm.toLowerCase());
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
                          <>Click "Load Pets" to view all pets</>
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
                                    : 'No pets found. Click "Load Pets" to fetch data.'}
                                </TableCell>
                              </TableRow>
                            ) : (
                              filtered.map((p: any) => (
                          <TableRow key={p._id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>
                              <Badge variant={
                                p.type === 'found' ? 'default' :
                                p.type === 'lost' ? 'secondary' : 'outline'
                              }>
                                {p.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{p.breed || 'Unknown'}</TableCell>
                            <TableCell className="text-sm">{p.location?.city || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={p.status === 'active' ? 'default' : 'outline'}>
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {format(new Date(p.createdAt), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {p.status && p.status !== 'resolved' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: 'Info',
                                      description: 'This feature will be implemented in the next update',
                                    });
                                  }}
                                >
                                  Mark Resolved
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
            </Tabs>
          </CardContent>
        </Card>
      </div>

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
  );
}
