import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Activity, CheckCircle, X, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopNav } from '@/components/layout/AdminTopNav';

export default function AdminRoleRequests() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [roleRequests, setRoleRequests] = useState<any[]>([]);
  const [roleRequestsLoading, setRoleRequestsLoading] = useState(false);
  const [roleRequestSearchTerm, setRoleRequestSearchTerm] = useState('');
  const [roleRequestStatusFilter, setRoleRequestStatusFilter] = useState<string>('all');
  const [roleRequestRoleFilter, setRoleRequestRoleFilter] = useState<string>('all');
  const [filteredRoleRequests, setFilteredRoleRequests] = useState<any[]>([]);
  const [selectedRoleRequest, setSelectedRoleRequest] = useState<any>(null);
  const [showRoleRequestDialog, setShowRoleRequestDialog] = useState(false);
  const [roleRequestActionNotes, setRoleRequestActionNotes] = useState('');
  const [roleRequestActionType, setRoleRequestActionType] = useState<'approve' | 'reject' | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadRoleRequests();
  }, [isAdmin, navigate]);

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
      loadRoleRequests();
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

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col min-w-0 lg:ml-64">
        {/* Top Navigation */}
        <AdminTopNav 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
          onRefresh={loadRoleRequests}
        />

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 lg:p-8 space-y-6 lg:space-y-8">
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Role Requests Found</h3>
                      <p className="text-gray-600">
                        {roleRequestSearchTerm || roleRequestStatusFilter !== 'all' || roleRequestRoleFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'No role requests found.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredRoleRequests.map((request: any) => (
                        <Card key={request._id || request.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                  <UserPlus className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">
                                    {request.user?.name || 'Unknown User'}
                                  </CardTitle>
                                  <CardDescription>
                                    {request.user?.email || 'N/A'}
                                  </CardDescription>
                                </div>
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
          </div>
        </main>
      </div>

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
    </div>
  );
}

