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
import { AdminLayout } from '@/components/layout/AdminLayout';
import { API_BASE_URL } from '@/config/api';

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
      const API_URL = API_BASE_URL;
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
      const API_URL = API_BASE_URL;
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
    <AdminLayout onRefresh={loadRoleRequests} isRefreshing={roleRequestsLoading}>
      <div className="space-y-6 lg:space-y-8">
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
            <CardContent className="pt-6 space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-500">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
                    <UserPlus className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-3xl font-bold text-gray-900">{roleRequests.length}</div>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-3xl font-bold text-yellow-600">
                      {roleRequests.filter((r: any) => r.status === 'pending').length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-3xl font-bold text-green-600">
                      {roleRequests.filter((r: any) => r.status === 'approved').length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
                    <X className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-3xl font-bold text-red-600">
                      {roleRequests.filter((r: any) => r.status === 'rejected').length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search by user, role, or reason..."
                      className="pl-9"
                      value={roleRequestSearchTerm}
                      onChange={(e) => setRoleRequestSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
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
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRoleRequestSearchTerm('');
                      setRoleRequestRoleFilter('all');
                      setRoleRequestStatusFilter('all');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {roleRequestsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                  <p className="mt-4 text-gray-600">Loading role requests...</p>
                </div>
              ) : filteredRoleRequests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <UserPlus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Role Requests Found</h3>
                  <p className="text-gray-600">
                    {roleRequestSearchTerm || roleRequestStatusFilter !== 'all' || roleRequestRoleFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No role requests have been submitted yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRoleRequests.map((request: any) => (
                    <Card key={request.id || request._id} className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col">
                      <div className={`h-2 w-full ${request.status === 'approved' ? 'bg-green-500' :
                        request.status === 'rejected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{request.user?.name || 'Unknown User'}</h3>
                            <p className="text-sm text-gray-500">{request.user?.email || 'No Email'}</p>
                          </div>
                          <Badge variant={
                            request.status === 'approved' ? 'default' :
                              request.status === 'rejected' ? 'destructive' :
                                'outline'
                          } className={
                            request.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }>
                            {request.status === 'pending' ? (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Pending
                              </div>
                            ) : request.status === 'approved' ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Approved
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <X className="h-3 w-3" /> Rejected
                              </div>
                            )}
                          </Badge>
                        </div>

                        <div className="space-y-3 mb-4 flex-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Requested Role:</span>
                            <span className="font-semibold capitalize text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                              {request.requested_role}
                            </span>
                          </div>

                          {request.experience && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Experience</p>
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 line-clamp-3">
                                {request.experience}
                              </p>
                            </div>
                          )}

                          {request.reason && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Reason</p>
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 line-clamp-3">
                                {request.reason}
                              </p>
                            </div>
                          )}

                          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                            Requested on: {request.created_at ? format(new Date(request.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </div>
                        </div>

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
    </AdminLayout>
  );
}

