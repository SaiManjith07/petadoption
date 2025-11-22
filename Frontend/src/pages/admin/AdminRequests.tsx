import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, HandHeart, Droplet, Truck, MapPin, Radio, 
  CheckCircle2, XCircle, Clock, AlertCircle, ShieldCheck,
  BedDouble, ClipboardCheck, FileText, Menu, X
} from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { adminAPI, roleRequestAPI, feedingPointAPI, alertAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function AdminRequests() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allRequests, setAllRequests] = useState<any>({
    role_requests: [],
    feeding_points: [],
    alerts: [],
    shelter_registrations: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAllRequests();
    } else if (isAuthenticated && !isAdmin) {
      navigate('/home');
    } else {
      navigate('/auth/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const loadAllRequests = async () => {
    try {
      setLoading(true);
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/pending-requests`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllRequests(data.data || data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to load requests');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type: 'approve' | 'reject', request: any, category: string) => {
    setSelectedRequest(request);
    setActionType(type);
    setShowDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      let url = '';
      let method = 'POST';

      if (selectedRequest.requested_role) {
        // Role request
        url = `${API_URL}/role-requests/${selectedRequest._id || selectedRequest.id}/${actionType === 'approve' ? 'approve' : 'reject'}`;
      } else if (selectedRequest.shelter_name) {
        // Shelter registration
        url = `${API_URL}/shelter-registrations/${selectedRequest._id || selectedRequest.id}/${actionType === 'approve' ? 'approve' : 'reject'}`;
      } else if (selectedRequest.type || selectedRequest.location_name) {
        // Feeding point
        url = `${API_URL}/feeding-points/${selectedRequest._id || selectedRequest.id}/${actionType === 'approve' ? 'approve' : 'reject'}`;
      } else if (selectedRequest.alert_type) {
        // Alert
        url = `${API_URL}/alerts/${selectedRequest._id || selectedRequest.id}/${actionType === 'approve' ? 'approve' : 'reject'}`;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_notes: adminNotes,
          reason: actionType === 'reject' ? adminNotes : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      toast({
        title: 'Success',
        description: `Request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      setShowDialog(false);
      setSelectedRequest(null);
      setAdminNotes('');
      loadAllRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process request',
        variant: 'destructive',
      });
    }
  };

  const totalPending = (allRequests.role_requests?.length || 0) + 
                      (allRequests.feeding_points?.length || 0) + 
                      (allRequests.alerts?.length || 0) +
                      (allRequests.shelter_registrations?.length || 0);

  if (!isAuthenticated || !isAdmin) {
    return null;
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
        {/* Mobile Menu Toggle */}
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
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Manage Requests</h1>
                  <p className="text-gray-600 mt-1">Review and approve/reject all pending requests</p>
                </div>
              </div>
            </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Role Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{allRequests.role_requests?.length || 0}</p>
                </div>
                <UserPlus className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shelter Reg.</p>
                  <p className="text-2xl font-bold text-gray-900">{allRequests.shelter_registrations?.length || 0}</p>
                </div>
                <BedDouble className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Feeding Points</p>
                  <p className="text-2xl font-bold text-gray-900">{allRequests.feeding_points?.length || 0}</p>
                </div>
                <MapPin className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{allRequests.alerts?.length || 0}</p>
                </div>
                <Radio className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="roles">Role Requests ({allRequests.role_requests?.length || 0})</TabsTrigger>
            <TabsTrigger value="shelters">Shelter Reg. ({allRequests.shelter_registrations?.length || 0})</TabsTrigger>
            <TabsTrigger value="feeding">Feeding Points ({allRequests.feeding_points?.length || 0})</TabsTrigger>
            <TabsTrigger value="alerts">Alerts ({allRequests.alerts?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (allRequests.role_requests?.length || 0) === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Role Requests</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allRequests.role_requests.map((request: any) => {
                  const roleIcons: any = {
                    rescuer: HandHeart,
                    feeder: Droplet,
                    transporter: Truck,
                  };
                  const Icon = roleIcons[request.requested_role] || UserPlus;
                  
                  return (
                    <Card key={request._id || request.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {request.user?.name || 'Unknown User'} - {request.requested_role}
                              </CardTitle>
                              <CardDescription>
                                {request.user?.email} • {format(new Date(request.createdAt), 'MMM d, yyyy')}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-700">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {request.reason && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Reason:</p>
                            <p className="text-sm text-gray-600">{request.reason}</p>
                          </div>
                        )}
                        {request.experience && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Experience:</p>
                            <p className="text-sm text-gray-600">{request.experience}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAction('approve', request, 'role')}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction('reject', request, 'role')}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shelters">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (allRequests.shelter_registrations?.length || 0) === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Shelter Registrations</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allRequests.shelter_registrations.map((shelter: any) => (
                  <Card key={shelter._id || shelter.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{shelter.shelter_name}</CardTitle>
                          <CardDescription>
                            {shelter.user?.name || 'Unknown'} • {shelter.location?.city || ''}, {shelter.location?.state || ''} • {shelter.location?.pincode || ''}
                          </CardDescription>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-700">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Capacity:</p>
                          <p className="text-sm text-gray-600">{shelter.capacity || 'N/A'} animals</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Area:</p>
                          <p className="text-sm text-gray-600">{shelter.area_sqft || 'N/A'} sq ft</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Accepts Feeding Data:</p>
                          <p className="text-sm text-gray-600">{shelter.accepts_feeding_data ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Contact:</p>
                          <p className="text-sm text-gray-600">{shelter.contact_info?.phone || shelter.user?.phone || 'N/A'}</p>
                        </div>
                      </div>
                      {shelter.facilities && shelter.facilities.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Facilities:</p>
                          <div className="flex flex-wrap gap-2">
                            {shelter.facilities.map((facility: string, idx: number) => (
                              <Badge key={idx} variant="outline">{facility}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAction('approve', shelter, 'shelter')}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction('reject', shelter, 'shelter')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feeding">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (allRequests.feeding_points?.length || 0) === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Feeding Points</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allRequests.feeding_points.map((point: any) => (
                  <Card key={point._id || point.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{point.name}</CardTitle>
                          <CardDescription>
                            {point.location?.address}, {point.location?.city} • {point.location?.pincode}
                          </CardDescription>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-700">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {point.description && (
                        <p className="text-sm text-gray-600 mb-4">{point.description}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAction('approve', point, 'feeding')}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction('reject', point, 'feeding')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="alerts">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (allRequests.alerts?.length || 0) === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Alerts</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allRequests.alerts.map((alert: any) => (
                  <Card key={alert._id || alert.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <CardDescription>
                            Pincode: {alert.pincode} • Type: {alert.alert_type} • Priority: {alert.priority}
                          </CardDescription>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-700">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{alert.description}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAction('approve', alert, 'alert')}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction('reject', alert, 'alert')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Approve' : 'Reject'} Request
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' 
                  ? 'Add optional notes for this approval'
                  : 'Please provide a reason for rejection'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder={actionType === 'approve' ? 'Optional notes...' : 'Reason for rejection...'}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setShowDialog(false);
                  setAdminNotes('');
                  setSelectedRequest(null);
                }}>
                  Cancel
                </Button>
                <Button
                  className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  onClick={confirmAction}
                  disabled={actionType === 'reject' && !adminNotes.trim()}
                >
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

