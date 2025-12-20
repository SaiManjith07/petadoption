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
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/api';
import { getImageUrl } from '@/services/api';
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
  const [shelterRegistrations, setShelterRegistrations] = useState<any[]>([]);
  const [shelterRegistrationsLoading, setShelterRegistrationsLoading] = useState(false);
  const [roleRequests, setRoleRequests] = useState<any[]>([]);
  const [roleRequestsLoading, setRoleRequestsLoading] = useState(false);
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
  const [petsLoading, setPetsLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [showPetDialog, setShowPetDialog] = useState(false);
  const [currentHash, setCurrentHash] = useState<string>('');
  const [selectedRoleRequest, setSelectedRoleRequest] = useState<any>(null);
  const [showRoleRequestDialog, setShowRoleRequestDialog] = useState(false);
  const [roleRequestActionNotes, setRoleRequestActionNotes] = useState('');
  const [roleRequestActionType, setRoleRequestActionType] = useState<'approve' | 'reject' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track hash changes
  useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash);
    };
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    // Load dashboard data on mount
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, navigate]);

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    if (!isAdmin) return;
    
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Load pets when navigating to #pets section and scroll to it
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#pets') {
      if (pets.length === 0 && !petsLoading) {
      loadAllPets();
    }
      // Scroll to the pets section
      setTimeout(() => {
        const element = document.getElementById('pets');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [pets.length, petsLoading]);

  // Load shelter registrations when navigating to #shelter-reg section
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#shelter-reg') {
      if (shelterRegistrations.length === 0 && !shelterRegistrationsLoading) {
      loadShelterRegistrations();
    }
      // Scroll to the shelter-reg section
      setTimeout(() => {
        const element = document.getElementById('shelter-reg');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [shelterRegistrations.length, shelterRegistrationsLoading]);

  // Load role requests when navigating to #role-requests section
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#role-requests') {
      if (roleRequests.length === 0 && !roleRequestsLoading) {
        loadRoleRequests();
      }
      // Scroll to the role-requests section
      setTimeout(() => {
        const element = document.getElementById('role-requests');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [roleRequests.length, roleRequestsLoading]);

  const loadDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) {
      setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const [dashDataRes, pendingFoundRes, pendingLostRes, adoptionData, chatRequestsData, chatsData, chatStatsData] = await Promise.allSettled([
        adminApi.getDashboardStats(),
        adminApi.getPendingReports('found'),
        adminApi.getPendingReports('lost'),
        adminApi.getPendingAdoptionRequests(),
        adminApi.getAllChatRequests(),
        adminApi.getAllChats(),
        adminApi.getChatStats(),
      ]);
      
      // Extract data from responses
      const dashData = dashDataRes.status === 'fulfilled' ? (dashDataRes.value?.data || dashDataRes.value) : null;
      const pendingFound = pendingFoundRes.status === 'fulfilled' ? 
        (Array.isArray(pendingFoundRes.value?.data) ? pendingFoundRes.value.data : 
         Array.isArray(pendingFoundRes.value) ? pendingFoundRes.value : []) : [];
      const pendingLost = pendingLostRes.status === 'fulfilled' ? 
        (Array.isArray(pendingLostRes.value?.data) ? pendingLostRes.value.data : 
         Array.isArray(pendingLostRes.value) ? pendingLostRes.value : []) : [];
      
      // Calculate actual pending counts from API
      const foundPendingCount = pendingFound.length;
      const lostPendingCount = pendingLost.length;
      const totalPendingCount = foundPendingCount + lostPendingCount;
      
      // Normalize dashboard data structure to match frontend expectations
      const normalizedDashData = dashData ? {
        pets: {
          found: dashData.pets?.found || 0,
          lost: dashData.pets?.lost || 0,
          adoptable: dashData.pets?.available || dashData.pets?.available_pets || 0,
          total: dashData.pets?.total || 0,
          pending: totalPendingCount, // Use actual count from API
        },
        users: {
          total: dashData.users?.total || 0,
          active: dashData.users?.active || 0,
          regular: (dashData.users?.total || 0) - (dashData.users?.active || 0),
          rescuers: 0, // Will be calculated if needed
        },
        pending: {
          total: totalPendingCount, // Use actual count from API
          found: foundPendingCount, // Use actual count from API
          lost: lostPendingCount, // Use actual count from API
        },
        active: {
          total: (dashData.pets?.found || 0) + (dashData.pets?.lost || 0),
          found: dashData.pets?.found || 0,
          lost: dashData.pets?.lost || 0,
        },
        matched: 0, // Will be calculated if needed
        applications: dashData.applications || {},
        chats: dashData.chats || {},
      } : null;
      
      setDashboardData(normalizedDashData);
      
      // Combine found and lost pending reports
      const pendingReportsArray = [...pendingFound, ...pendingLost];
      setPendingReports(pendingReportsArray);
      
      
      setPendingAdoptions(adoptionData.status === 'fulfilled' ? 
        (Array.isArray(adoptionData.value?.data) ? adoptionData.value.data : 
         Array.isArray(adoptionData.value) ? adoptionData.value : []) : []);
      setChatRequests(chatRequestsData.status === 'fulfilled' ? 
        (Array.isArray(chatRequestsData.value?.data) ? chatRequestsData.value.data : 
         Array.isArray(chatRequestsData.value) ? chatRequestsData.value : []) : []);
      setActiveChats(chatsData.status === 'fulfilled' ? 
        (Array.isArray(chatsData.value?.data) ? chatsData.value.data : 
         Array.isArray(chatsData.value) ? chatsData.value : []) : []);
      setChatStats(chatStatsData.status === 'fulfilled' ? (chatStatsData.value || {}) : {});
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not load dashboard data',
        variant: 'destructive',
      });
    } finally {
      if (showLoading) {
      setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const loadAllPets = async () => {
    try {
      setPetsLoading(true);
      const petsData = await adminApi.getAllPets();
      // Ensure we have an array and normalize field names
      const normalizedPets = Array.isArray(petsData) ? petsData.map((p: any) => ({
        ...p,
        _id: p.id || p._id, // Support both id formats
        createdAt: p.created_at || p.createdAt,
      })) : [];
      setPets(normalizedPets);
    } catch (error: any) {
      console.error('Error loading pets:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not load pets',
        variant: 'destructive',
      });
      setPets([]);
    } finally {
      setPetsLoading(false);
    }
  };

  const loadShelterRegistrations = async () => {
    try {
      setShelterRegistrationsLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'https://petadoption-v2q3.onrender.com/api';
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/shelter-registrations/all`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch shelter registrations');
      const data = await response.json();
      setShelterRegistrations(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not load shelter registrations',
        variant: 'destructive',
      });
      setShelterRegistrations([]);
    } finally {
      setShelterRegistrationsLoading(false);
    }
  };

  const [roleRequestSearchTerm, setRoleRequestSearchTerm] = useState('');
  const [roleRequestStatusFilter, setRoleRequestStatusFilter] = useState<string>('all');
  const [roleRequestRoleFilter, setRoleRequestRoleFilter] = useState<string>('all');
  const [filteredRoleRequests, setFilteredRoleRequests] = useState<any[]>([]);

  const loadRoleRequests = async () => {
    try {
      setRoleRequestsLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'https://petadoption-v2q3.onrender.com/api';
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/role-requests/all/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch role requests');
      const data = await response.json();
      const requests = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setRoleRequests(requests);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not load role requests',
        variant: 'destructive',
      });
      setRoleRequests([]);
    } finally {
      setRoleRequestsLoading(false);
    }
  };

  // Filter role requests
  useEffect(() => {
    let filtered = [...roleRequests];

    // Search filter
    if (roleRequestSearchTerm) {
      filtered = filtered.filter((req: any) =>
        req.user?.name?.toLowerCase().includes(roleRequestSearchTerm.toLowerCase()) ||
        req.user?.email?.toLowerCase().includes(roleRequestSearchTerm.toLowerCase()) ||
        req.requested_role?.toLowerCase().includes(roleRequestSearchTerm.toLowerCase()) ||
        req.reason?.toLowerCase().includes(roleRequestSearchTerm.toLowerCase()) ||
        req.experience?.toLowerCase().includes(roleRequestSearchTerm.toLowerCase())
      );
    }

    // Status filter
    if (roleRequestStatusFilter !== 'all') {
      filtered = filtered.filter((req: any) => req.status === roleRequestStatusFilter);
    }

    // Role filter
    if (roleRequestRoleFilter !== 'all') {
      filtered = filtered.filter((req: any) => req.requested_role === roleRequestRoleFilter);
    }

    setFilteredRoleRequests(filtered);
  }, [roleRequests, roleRequestSearchTerm, roleRequestStatusFilter, roleRequestRoleFilter]);

  const handleShelterAction = async (shelterId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://petadoption-v2q3.onrender.com/api';
      const response = await fetch(`${API_URL}/shelter-registrations/${shelterId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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
      // Reload shelter registrations and refresh dashboard
      await loadShelterRegistrations();
      loadDashboardData(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} shelter registration`,
        variant: 'destructive',
      });
    }
  };

  const handleRoleRequestAction = async (requestId: string | number, action: 'approve' | 'reject', notes?: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://petadoption-v2q3.onrender.com/api';
      const response = await fetch(`${API_URL}/role-requests/${requestId}/${action}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_notes: notes || '' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${action} role request`);
      }
      toast({
        title: 'Success',
        description: `Role request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });
      setShowRoleRequestDialog(false);
      setSelectedRoleRequest(null);
      setRoleRequestActionNotes('');
      setRoleRequestActionType(null);
      // Reload role requests and refresh dashboard
      await loadRoleRequests();
      loadDashboardData(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} role request`,
        variant: 'destructive',
      });
    }
  };

  const openRoleRequestAction = (request: any, action: 'approve' | 'reject') => {
    setSelectedRoleRequest(request);
    setRoleRequestActionType(action);
    setRoleRequestActionNotes('');
    setShowRoleRequestDialog(true);
  };

  const submitRoleRequestAction = () => {
    if (!selectedRoleRequest || !roleRequestActionType) return;
    
    if (roleRequestActionType === 'reject' && !roleRequestActionNotes.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    handleRoleRequestAction(
      selectedRoleRequest._id || selectedRoleRequest.id,
      roleRequestActionType,
      roleRequestActionNotes
    );
  };

  const handleDeactivateUser = async (userId: string | number) => {
    try {
      await adminApi.deleteUser(userId);
      setUsers(users.filter((u: any) => (u.id || u._id) !== userId));
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
        await adminApi.acceptReport(acceptingId, acceptNotes, verificationParams);
        // Update local state immediately
        const updatedReports = pendingReports.filter(r => r._id !== acceptingId);
        setPendingReports(updatedReports);
        
        // Update dashboard counts
        if (dashboardData) {
          const report = pendingReports.find((r: any) => r._id === acceptingId);
          const status = report?.report_type === 'found' ? 'found' : 'lost';
          setDashboardData({
            ...dashboardData,
            pending: {
              ...dashboardData.pending,
              total: Math.max(0, dashboardData.pending.total - 1),
              [status]: Math.max(0, (dashboardData.pending[status] || 0) - 1),
            },
            active: {
              ...dashboardData.active,
              total: (dashboardData.active.total || 0) + 1,
              [status]: (dashboardData.active[status] || 0) + 1,
            },
          });
        }
        
        toast({
          title: 'Success',
          description: 'Report accepted and listed',
        });
      } else {
        await adminApi.acceptAdoptionRequest(acceptingId, acceptNotes, verificationParams, adopterId || undefined);
        // Update local state immediately
        const updatedAdoptions = pendingAdoptions.filter(a => a._id !== acceptingId);
        setPendingAdoptions(updatedAdoptions);
        
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
      
      // Refresh full data in background
      loadDashboardData(false);
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
      await adminApi.rejectReport(reportId, rejectReason);
      // Remove from local state immediately for better UX
      const updatedReports = pendingReports.filter(r => r._id !== reportId);
      setPendingReports(updatedReports);
      
      // Update dashboard data counts
      if (dashboardData) {
        const status = reportId.toString().includes('found') ? 'found' : 'lost';
        setDashboardData({
          ...dashboardData,
          pending: {
            ...dashboardData.pending,
            total: Math.max(0, dashboardData.pending.total - 1),
            [status]: Math.max(0, (dashboardData.pending[status] || 0) - 1),
          },
        });
      }
      
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectReason('');
      toast({
        title: 'Success',
        description: 'Report rejected',
      });
      
      // Refresh full data in background
      loadDashboardData(false);
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="relative">
            <Shield className="h-16 w-16 mx-auto text-[#4CAF50] animate-pulse" />
            <div className="absolute inset-0 border-4 border-[#E8F8EE] border-t-[#4CAF50] rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Admin Dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 lg:space-y-8">
          {/* Dashboard Content - Only show when not viewing #shelter-reg */}
          {currentHash !== '#shelter-reg' && (
            <>
          {/* Key Metrics at a Glance - 4 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pending Reports Card */}
            <Card className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                    </div>
                      <span className="text-sm font-semibold text-gray-600">Pending Reports</span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">{dashboardData?.pending?.total || 0}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{dashboardData?.pending?.found || 0} Found</span>
                      <span>•</span>
                      <span>{dashboardData?.pending?.lost || 0} Lost</span>
                    </div>
                  </div>
                  <Link to="/admin/found-pets">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Adoptions Card */}
            <Card className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Home className="h-5 w-5 text-blue-500" />
                    </div>
                      <span className="text-sm font-semibold text-gray-600">Adoptions</span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">{pendingAdoptions.length}</p>
                    <p className="text-xs text-gray-500">Pending approval</p>
                  </div>
                  <Link to="/admin/adopt">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Total Users Card */}
            <Card className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-500" />
                    </div>
                      <span className="text-sm font-semibold text-gray-600">Total Users</span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">{dashboardData?.users?.total || 0}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{dashboardData?.users?.regular || 0} Regular</span>
                      <span>•</span>
                      <span>{dashboardData?.users?.rescuers || 0} Rescuers</span>
                    </div>
                  </div>
                  <Link to="/admin/users">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-xl">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Active Reports Card */}
            <Card className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-[#E8F8EE] flex items-center justify-center">
                      <PawPrint className="h-5 w-5 text-[#4CAF50]" />
                    </div>
                      <span className="text-sm font-semibold text-gray-600">Active Reports</span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">{dashboardData?.active?.total || 0}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{dashboardData?.active?.found || 0} Found</span>
                      <span>•</span>
                      <span>{dashboardData?.active?.lost || 0} Lost</span>
                    </div>
                  </div>
                  <Link to="/admin/found-pets">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#4CAF50] hover:bg-[#E8F8EE] rounded-xl">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Overview Analytics */}
          <Card className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100">
            <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">System Overview</CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">Platform analytics and insights</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#E8F8EE] flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-[#4CAF50]" />
                </div>
              </div>
            </CardHeader>
          <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-[#E8F8EE] rounded-xl border border-[#4CAF50]/10">
                  <p className="text-3xl font-bold text-gray-900">{dashboardData?.pets?.found || 0}</p>
                  <p className="text-xs text-gray-600 mt-2 font-medium">Found Pets</p>
                            </div>
                <div className="text-center p-4 bg-[#E8F8EE] rounded-xl border border-[#4CAF50]/10">
                  <p className="text-3xl font-bold text-gray-900">{dashboardData?.pets?.lost || 0}</p>
                  <p className="text-xs text-gray-600 mt-2 font-medium">Lost Pets</p>
                          </div>
                <div className="text-center p-4 bg-[#E8F8EE] rounded-xl border border-[#4CAF50]/10">
                  <p className="text-3xl font-bold text-gray-900">{dashboardData?.pets?.adoptable || 0}</p>
                  <p className="text-xs text-gray-600 mt-2 font-medium">Adoptable</p>
                            </div>
                <div className="text-center p-4 bg-[#E8F8EE] rounded-xl border border-[#4CAF50]/10">
                  <p className="text-3xl font-bold text-gray-900">{dashboardData?.matched || 0}</p>
                  <p className="text-xs text-gray-600 mt-2 font-medium">Matched</p>
                          </div>
                          </div>
                        </CardContent>
                      </Card>

          {/* Management Center removed - all functionalities moved to sidebar */}
            </>
          )}

          {/* All Pets Section - Moved to separate page /admin/all-pets */}
          {false && (
          <section id="pets" className="scroll-mt-8">
            <Card className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">All Pets</CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      View and manage all pets in the database (Lost, Found, Adopted)
                    </CardDescription>
                                  </div>
                                  </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
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
                    // Map adoption_status to report_type for filtering
                    const reportType = p.adoption_status === 'Found' ? 'found' : 
                                      p.adoption_status === 'Lost' ? 'lost' : null;
                    
                    const matchesSearch = !searchTerm || 
                      p.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.adoption_status?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesType = typeFilter === 'all' || reportType === typeFilter || p.report_type === typeFilter || p.type === typeFilter;
                    const matchesStatus = statusFilter === 'all' || p.adoption_status === statusFilter || p.status === statusFilter;
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
                            {filtered.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <PawPrint className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                                    ? 'No pets match your search' 
                              : 'No pets found'}
                          </h3>
                          <p className="text-gray-600">
                            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                              ? 'Try adjusting your search or filters' 
                              : 'Click "Refresh" to load all pets.'}
                          </p>
                        </div>
                            ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filtered.map((p: any) => {
                                const petId = p.id || p._id;
                                const createdDate = p.created_at || p.createdAt || p.date_submitted;
                            const petImage = p.image || p.images?.[0]?.image || p.images?.[0]?.image_url || p.image_url;
                            const imageUrl = petImage ? (petImage.startsWith('http') ? petImage : getImageUrl(petImage)) : 'https://via.placeholder.com/300x200?text=No+Image';
                            
                                return (
                              <Card key={petId} className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden flex flex-col">
                                {/* Pet Image */}
                                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                                  <img
                                    src={imageUrl}
                                    alt={p.name || 'Pet'}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-3 right-3">
                              <Badge variant={
                                p.adoption_status === 'Found' ? 'default' :
                                p.adoption_status === 'Lost' ? 'secondary' : 
                                p.adoption_status === 'Pending' ? 'outline' : 'outline'
                                    } className="shadow-lg">
                                {p.adoption_status === 'Found' ? 'Found' :
                                 p.adoption_status === 'Lost' ? 'Lost' :
                                 p.adoption_status === 'Pending' ? 'Pending' :
                                 p.adoption_status === 'Available for Adoption' ? 'Adoption' :
                                       p.adoption_status === 'Adopted' ? 'Adopted' :
                                 p.adoption_status || 'N/A'}
                              </Badge>
                                  </div>
                                  {p.is_verified && (
                                    <div className="absolute top-3 left-3">
                                      <Badge variant="default" className="bg-green-500 shadow-lg">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Verified
                              </Badge>
                                    </div>
                                  )}
                    </div>

                                {/* Card Content */}
                                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                                      {p.name || 'Unnamed Pet'}
                                    </h3>
                                    <div className="space-y-2 mb-4">
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <PawPrint className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">Breed:</span>
                                        <span>{p.breed || 'Unknown'}</span>
                  </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Search className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">Location:</span>
                                        <span className="line-clamp-1">{p.location || 'N/A'}</span>
                                      </div>
                                      {createdDate && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Calendar className="h-4 w-4 text-gray-400" />
                                          <span className="font-medium">Reported:</span>
                                          <span>{format(new Date(createdDate), 'MMM dd, yyyy')}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* View More Button */}
                              <Button
                                    variant="default"
                                    className="w-full bg-[#4CAF50] hover:bg-[#2E7D32] text-white mt-auto"
                      onClick={() => {
                                      setSelectedPet(p);
                                      setShowPetDialog(true);
                      }}
                              >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View More
                              </Button>
                                </CardContent>
                              </Card>
                                );
                          })}
                    </div>
                      )}
                  </>
                );
              })()}
              </CardContent>
            </Card>
          </section>
          )}

          {/* Shelter Registrations Section - Only show when on #shelter-reg */}
          {currentHash === '#shelter-reg' && (
          <section id="shelter-reg" className="scroll-mt-8">
            <Card className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Shelter Registrations</CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      Review and manage shelter registration requests
                    </CardDescription>
                  </div>
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
                  </div>
              </CardHeader>
              <CardContent className="pt-6">
                {shelterRegistrationsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading shelter registrations...</p>
                  </div>
                ) : shelterRegistrations.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shelter Registrations</h3>
                    <p className="text-gray-600">No shelter registration requests found.</p>
                          </div>
                          ) : (
                            <div className="space-y-4">
                    {shelterRegistrations.map((shelter: any) => (
                      <Card key={shelter._id || shelter.id} className="hover:shadow-md transition-shadow">
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
                                {shelter.location?.city || shelter.city || 'N/A'}, {shelter.location?.state || shelter.state || ''}
                                        </p>
                              <p className="text-xs text-gray-500">{shelter.location?.pincode || shelter.pincode || ''}</p>
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
                                    {shelter.status === 'pending' && (
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={() => {
                                            const notes = prompt('Add optional notes for approval:');
                                            if (notes !== null) {
                                    handleShelterAction(shelter._id || shelter.id, 'approve', notes);
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
                                    handleShelterAction(shelter._id || shelter.id, 'reject', reason);
                                            }
                                          }}
                                        >
                                          <X className="mr-2 h-4 w-4" />
                                          Reject
                                        </Button>
                                      </div>
                                    )}
                        </CardContent>
                      </Card>
                                          ))}
                                        </div>
                )}
              </CardContent>
            </Card>
          </section>
          )}

          {/* Role Requests Section - Moved to separate page /admin/role-requests */}
          {false && (
          <section id="role-requests" className="scroll-mt-8">
            <Card className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Role Requests</CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      Manage volunteer role requests (rescuer, feeder, transporter, volunteer)
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadRoleRequests}
                    disabled={roleRequestsLoading}
                    className="gap-2"
                  >
                    {roleRequestsLoading ? (
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
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Filters and Search */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, email, role, or reason..."
                        value={roleRequestSearchTerm}
                        onChange={(e) => setRoleRequestSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={roleRequestStatusFilter}
                      onChange={(e) => setRoleRequestStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <select
                      value={roleRequestRoleFilter}
                      onChange={(e) => setRoleRequestRoleFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="rescuer">Rescuer</option>
                      <option value="feeder">Feeder</option>
                      <option value="transporter">Transporter</option>
                      <option value="volunteer">Volunteer</option>
                    </select>
                  </div>
                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{roleRequests.length}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Pending</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {roleRequests.filter((r: any) => r.status === 'pending').length}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Approved</p>
                      <p className="text-2xl font-bold text-green-700">
                        {roleRequests.filter((r: any) => r.status === 'approved').length}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Rejected</p>
                      <p className="text-2xl font-bold text-red-700">
                        {roleRequests.filter((r: any) => r.status === 'rejected').length}
                      </p>
                    </div>
                  </div>
                </div>

                {roleRequestsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading role requests...</p>
                  </div>
                ) : filteredRoleRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Role Requests</h3>
                    <p className="text-gray-600">
                      {roleRequestSearchTerm || roleRequestStatusFilter !== 'all' || roleRequestRoleFilter !== 'all'
                        ? 'No role requests match your filters'
                        : 'No role requests found.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRoleRequests.map((request: any) => (
                      <Card key={request._id || request.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {request.user?.name || request.requested_by?.name || 'Unknown User'}
                              </CardTitle>
                              <CardDescription>
                                {request.user?.email || request.requested_by?.email || 'N/A'}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                request.status === 'pending' ? 'default' :
                                request.status === 'approved' ? 'default' :
                                'destructive'
                              }
                              className={
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }
                            >
                              {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {request.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {request.status === 'rejected' && <X className="h-3 w-3 mr-1" />}
                              {request.status || 'Pending'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-1">Requested Role</p>
                              <Badge variant="outline" className="text-base capitalize">
                                {request.requested_role || 'N/A'}
                              </Badge>
                            </div>
                            {request.user?.phone && (
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">Phone</p>
                                <p className="text-sm text-gray-600">{request.user.phone}</p>
                              </div>
                            )}
                            {request.created_at && (
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">Requested Date</p>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                                </p>
                              </div>
                            )}
                            {request.reviewed_at && (
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">Reviewed Date</p>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(request.reviewed_at), 'MMM dd, yyyy HH:mm')}
                                </p>
                              </div>
                            )}
                          </div>

                          {request.reason && (
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-gray-700 mb-1">Reason</p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{request.reason}</p>
                            </div>
                          )}

                          {request.experience && (
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-gray-700 mb-1">Experience</p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{request.experience}</p>
                            </div>
                          )}

                          {request.availability && (
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-gray-700 mb-1">Availability</p>
                              <p className="text-sm text-gray-600">{request.availability}</p>
                            </div>
                          )}

                          {request.resources && (
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-gray-700 mb-1">Resources</p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{request.resources}</p>
                            </div>
                          )}

                          {request.review_notes && (
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-gray-700 mb-1">Review Notes</p>
                              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">{request.review_notes}</p>
                            </div>
                          )}

                          {request.reviewed_by_name && (
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-gray-700 mb-1">Reviewed By</p>
                              <p className="text-sm text-gray-600">{request.reviewed_by_name}</p>
                            </div>
                          )}
                          {request.status === 'pending' && (
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 flex-1"
                                onClick={() => openRoleRequestAction(request, 'approve')}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                onClick={() => openRoleRequestAction(request, 'reject')}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
              </CardContent>
            </Card>
          </section>
          )}

          {/* Role Request Action Dialog */}
          <Dialog open={showRoleRequestDialog} onOpenChange={setShowRoleRequestDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {roleRequestActionType === 'approve' ? 'Approve Role Request' : 'Reject Role Request'}
                </DialogTitle>
                <DialogDescription>
                  {roleRequestActionType === 'approve'
                    ? 'Add optional notes for approval'
                    : 'Please provide a reason for rejection (required)'}
                </DialogDescription>
              </DialogHeader>
              {selectedRoleRequest && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Request Details</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">User:</span> {selectedRoleRequest.user?.name || 'Unknown'}</p>
                      <p><span className="font-medium">Email:</span> {selectedRoleRequest.user?.email || 'N/A'}</p>
                      <p><span className="font-medium">Requested Role:</span> <span className="capitalize">{selectedRoleRequest.requested_role}</span></p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="action-notes" className="text-sm font-semibold">
                      {roleRequestActionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
                    </Label>
                    <Textarea
                      id="action-notes"
                      value={roleRequestActionNotes}
                      onChange={(e) => setRoleRequestActionNotes(e.target.value)}
                      placeholder={
                        roleRequestActionType === 'approve'
                          ? 'Add any notes about this approval...'
                          : 'Explain why this role request is being rejected...'
                      }
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRoleRequestDialog(false);
                        setSelectedRoleRequest(null);
                        setRoleRequestActionNotes('');
                        setRoleRequestActionType(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={submitRoleRequestAction}
                      className={
                        roleRequestActionType === 'approve'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }
                    >
                      {roleRequestActionType === 'approve' ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Pet Details Dialog */}
          <Dialog open={showPetDialog} onOpenChange={setShowPetDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {selectedPet?.name || 'Pet Details'}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  Complete information about the pet
                </DialogDescription>
              </DialogHeader>
              
              {selectedPet && (
                <div className="space-y-6 mt-4">
                  {/* Pet Image Gallery */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedPet.images && selectedPet.images.length > 0 ? (
                        selectedPet.images.map((img: any, idx: number) => {
                          const imageUrl = img.image_url || img.image || selectedPet.image_url || selectedPet.image;
                          const photoUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : getImageUrl(imageUrl)) : 'https://via.placeholder.com/300x200?text=No+Image';
                      return (
                            <div key={idx} className="relative h-48 rounded-lg overflow-hidden border border-gray-200">
                              <img
                                src={photoUrl}
                                alt={`Pet photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                          </div>
                          );
                        })
                      ) : selectedPet.image ? (
                        <div className="relative h-48 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={selectedPet.image_url || getImageUrl(selectedPet.image) || 'https://via.placeholder.com/300x200?text=No+Image'}
                            alt="Pet"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          No images available
                  </div>
                )}
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gray-50">
                                  <CardHeader>
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Pet Name</Label>
                          <p className="text-gray-900">{selectedPet.name || 'Unnamed'}</p>
                                        </div>
                                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Breed</Label>
                          <p className="text-gray-900">{selectedPet.breed || 'Unknown'}</p>
                                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Species</Label>
                          <p className="text-gray-900">{selectedPet.species || selectedPet.type || 'N/A'}</p>
                                      </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Status</Label>
                          <div className="mt-1">
                            <Badge variant={
                              selectedPet.adoption_status === 'Found' ? 'default' :
                              selectedPet.adoption_status === 'Lost' ? 'secondary' : 
                              selectedPet.adoption_status === 'Pending' ? 'outline' : 'outline'
                            }>
                              {selectedPet.adoption_status === 'Found' ? 'Found' :
                               selectedPet.adoption_status === 'Lost' ? 'Lost' :
                               selectedPet.adoption_status === 'Pending' ? 'Pending' :
                               selectedPet.adoption_status === 'Available for Adoption' ? 'Available for Adoption' :
                               selectedPet.adoption_status === 'Adopted' ? 'Adopted' :
                               selectedPet.adoption_status || 'N/A'}
                                      </Badge>
                            {selectedPet.is_verified && (
                              <Badge variant="default" className="ml-2 bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                                    </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-lg">Location & Contact</CardTitle>
                                  </CardHeader>
                      <CardContent className="space-y-3">
                                      <div>
                          <Label className="text-sm font-semibold text-gray-700">Location</Label>
                          <p className="text-gray-900">{selectedPet.location || 'N/A'}</p>
                                      </div>
                        {selectedPet.pincode && (
                                      <div>
                            <Label className="text-sm font-semibold text-gray-700">Pincode</Label>
                            <p className="text-gray-900">{selectedPet.pincode}</p>
                                      </div>
                        )}
                        {selectedPet.city && (
                                      <div>
                            <Label className="text-sm font-semibold text-gray-700">City</Label>
                            <p className="text-gray-900">{selectedPet.city}</p>
                                      </div>
                        )}
                        {selectedPet.state && (
                                      <div>
                            <Label className="text-sm font-semibold text-gray-700">State</Label>
                            <p className="text-gray-900">{selectedPet.state}</p>
                                      </div>
                        )}
                        {selectedPet.contact_phone && (
                          <div>
                            <Label className="text-sm font-semibold text-gray-700">Contact Phone</Label>
                            <p className="text-gray-900">{selectedPet.contact_phone}</p>
                                    </div>
                        )}
                        {selectedPet.contact_email && (
                          <div>
                            <Label className="text-sm font-semibold text-gray-700">Contact Email</Label>
                            <p className="text-gray-900">{selectedPet.contact_email}</p>
                                        </div>
                        )}
                      </CardContent>
                    </Card>
                                      </div>

                  {/* Description */}
                  {selectedPet.description && (
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-lg">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedPet.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Physical Details */}
                  {(selectedPet.age || selectedPet.gender || selectedPet.color || selectedPet.size || selectedPet.weight) && (
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-lg">Physical Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {selectedPet.age && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Age</Label>
                              <p className="text-gray-900">{selectedPet.age}</p>
                                      </div>
                                    )}
                          {selectedPet.gender && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Gender</Label>
                              <p className="text-gray-900">{selectedPet.gender}</p>
                                      </div>
                                    )}
                          {selectedPet.color && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Color</Label>
                              <p className="text-gray-900">{selectedPet.color}</p>
                                      </div>
                                    )}
                          {selectedPet.size && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Size</Label>
                              <p className="text-gray-900">{selectedPet.size}</p>
                            </div>
                          )}
                          {selectedPet.weight && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Weight</Label>
                              <p className="text-gray-900">{selectedPet.weight}</p>
                  </div>
                )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Additional Information */}
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedPet.created_at || selectedPet.createdAt || selectedPet.date_submitted ? (
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Reported Date</Label>
                          <p className="text-gray-900">
                            {format(new Date(selectedPet.created_at || selectedPet.createdAt || selectedPet.date_submitted), 'MMM dd, yyyy HH:mm')}
                          </p>
                </div>
                      ) : null}
                      {selectedPet.last_seen && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Last Seen</Label>
                          <p className="text-gray-900">
                            {format(new Date(selectedPet.last_seen), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                      {selectedPet.posted_by && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Reported By</Label>
                          <p className="text-gray-900">
                            {selectedPet.posted_by.name || 'Unknown'} ({selectedPet.posted_by.email || 'N/A'})
                          </p>
                        </div>
                      )}
          </CardContent>
        </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/pets/${selectedPet.id || selectedPet._id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Page
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPetDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Modals and other components */}
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
