import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Activity, CheckCircle, X, Clock, AlertCircle, Shield } from 'lucide-react';
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

// Unified type for all request kinds
interface SpecializedRequest {
  id: string | number;
  originalId: string | number; // ID in the backend database
  type: 'role_request' | 'shelter_registration' | 'volunteer_registration';
  user: {
    name: string;
    email: string;
    id: string | number;
  };
  requested_role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  // Specific fields
  ngo_name?: string;
  experience?: string;
  reason?: string;
  shelter_capacity?: number;
  can_provide_shelter?: boolean;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  review_notes?: string;
  reviewed_by_name?: string;
}

export default function AdminRoleRequests() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [allRequests, setAllRequests] = useState<SpecializedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [filteredRequests, setFilteredRequests] = useState<SpecializedRequest[]>([]);

  // Action state
  const [selectedRequest, setSelectedRequest] = useState<SpecializedRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadAllRequests();
  }, [isAdmin, navigate]);

  const loadAllRequests = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      const headers = { 'Authorization': `Bearer ${accessToken}` };

      // 1. Fetch generic Role Requests
      const roleReqResponse = await fetch(`${API_BASE_URL}/role-requests/all/`, { headers });
      const roleReqData = roleReqResponse.ok ? await roleReqResponse.json() : { data: [] };
      const rawRoleRequests = Array.isArray(roleReqData.data) ? roleReqData.data : [];

      // 2. Fetch Pending Specialized Requests (Shelters, Volunteers)
      // Note: This endpoint usually returns { data: { shelter_registrations: [], ... } }
      const pendingResponse = await fetch(`${API_BASE_URL}/admin/pending-requests/`, { headers });
      const pendingData = pendingResponse.ok ? await pendingResponse.json() : { data: {} };

      const shelterRegs = pendingData.data?.shelter_registrations || [];
      const volunteerRegs = pendingData.data?.role_requests || []; // Sometimes they might be here or under volunteers

      // Normalize Role Requests
      const normalizedRoleRequests: SpecializedRequest[] = rawRoleRequests.map((req: any) => ({
        id: `rr-${req.id}`,
        originalId: req.id,
        type: 'role_request',
        user: {
          name: req.user?.name || 'Unknown',
          email: req.user?.email || 'N/A',
          id: req.user?.id
        },
        requested_role: req.requested_role,
        status: req.status,
        created_at: req.created_at,
        experience: req.experience,
        reason: req.reason,
        review_notes: req.review_notes,
        reviewed_by_name: req.reviewed_by?.name
      }));

      // Normalize Shelter Registrations
      const normalizedShelters: SpecializedRequest[] = shelterRegs.map((req: any) => ({
        id: `sh-${req.id}`,
        originalId: req.id,
        type: 'shelter_registration',
        user: {
          name: req.user?.name || 'Unknown',
          email: req.user?.email || 'N/A',
          id: req.user?.id
        },
        requested_role: 'shelter',
        status: 'pending', // These are usually pending if fetching from pending-requests
        created_at: req.createdAt || req.created_at || new Date().toISOString(),
        ngo_name: req.shelter_name,
        shelter_capacity: req.total_capacity,
        address: req.location?.address,
        city: req.location?.city,
        state: req.location?.state,
        pincode: req.location?.pincode,
        reason: req.facilities?.join(', ') // specific field mapping
      }));

      // Combine all
      setAllRequests([...normalizedRoleRequests, ...normalizedShelters]);

    } catch (error: any) {
      console.error("Failed to load requests", error);
      toast({
        title: 'Error',
        description: 'Failed to load requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter effect
  useEffect(() => {
    let result = [...allRequests];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(req =>
        req.user.name.toLowerCase().includes(lower) ||
        req.user.email.toLowerCase().includes(lower) ||
        req.requested_role.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(req => req.status === statusFilter);
    }

    if (roleFilter !== 'all') {
      result = result.filter(req => req.requested_role === roleFilter);
    }

    // Sort by date desc
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredRequests(result);
  }, [allRequests, searchTerm, statusFilter, roleFilter]);

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      const accessToken = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };
      const notes = actionNotes || '';
      const isApprove = actionType === 'approve';

      let url = '';
      let body = {};

      if (selectedRequest.type === 'role_request') {
        // Role Request Model
        url = `${API_BASE_URL}/role-requests/${selectedRequest.originalId}/${actionType}/`;
        body = { admin_notes: notes };
      } else if (selectedRequest.type === 'shelter_registration') {
        // Shelter Model
        url = `${API_BASE_URL}/admin/shelters/${selectedRequest.originalId}/verify/`;
        body = {
          approved: isApprove,
          notes: notes,
          verification_params: isApprove ? {
            verified_registration: true,
            verified_identity: true
          } : {}
        };
      } else if (selectedRequest.type === 'volunteer_registration') {
        url = `${API_BASE_URL}/admin/volunteers/${selectedRequest.originalId}/verify/`;
        body = { approved: isApprove, notes: notes };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || err.error || 'Action failed');
      }

      toast({
        title: 'Success',
        description: `Request ${isApprove ? 'approved' : 'rejected'} successfully`,
      });

      setShowDialog(false);
      loadAllRequests(); // Reload data

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openDialog = (req: SpecializedRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(req);
    setActionType(action);
    setActionNotes('');
    setShowDialog(true);
  };

  return (
    <AdminLayout onRefresh={loadAllRequests} isRefreshing={loading}>
      <div className="space-y-6 lg:space-y-8">
        <section className="scroll-mt-8">
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Role & Shelter Requests</CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">
                    Manage all incoming requests for volunteers, shelters, and other roles.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadAllRequests} disabled={loading} className="gap-2">
                  <Activity className="h-4 w-4" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-none">
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm text-blue-600">Total Requests</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 text-2xl font-bold text-blue-700">{allRequests.length}</CardContent>
                </Card>
                <Card className="bg-yellow-50 border-none">
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm text-yellow-600">Pending</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 text-2xl font-bold text-yellow-700">{allRequests.filter(r => r.status === 'pending').length}</CardContent>
                </Card>
                <Card className="bg-green-50 border-none">
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm text-green-600">Approved</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 text-2xl font-bold text-green-700">{allRequests.filter(r => r.status === 'approved').length}</CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="h-10 px-3 py-2 border rounded-md text-sm bg-background"
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="shelter">Shelter</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="rescuer">Rescuer</option>
                  </select>
                  <select
                    className="h-10 px-3 py-2 border rounded-md text-sm bg-background"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* List */}
              {loading ? (
                <div className="py-12 text-center text-gray-500">Loading requests...</div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg">No requests found matching your filters.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRequests.map(req => (
                    <Card key={req.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                      <div className={`h-1 w-full ${req.status === 'approved' ? 'bg-green-500' :
                          req.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                      <CardContent className="p-5 flex-1 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{req.user.name}</h3>
                            <p className="text-sm text-gray-500">{req.user.email}</p>
                          </div>
                          <Badge variant={req.status === 'pending' ? 'outline' : req.status === 'approved' ? 'default' : 'destructive'}>
                            {req.status}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Role:</span>
                            <span className="font-medium capitalize">{req.requested_role}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Date:</span>
                            <span className="font-medium">{format(new Date(req.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                          {req.city && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Location:</span>
                              <span className="font-medium">{req.city}</span>
                            </div>
                          )}
                        </div>

                        {req.reason && (
                          <div className="bg-gray-50 p-2 rounded text-sm text-gray-700 mt-2">
                            <p className="font-xs text-gray-400 uppercase text-[10px] tracking-wider mb-1">Reason / Details</p>
                            {req.reason}
                          </div>
                        )}

                        <div className="flex-1" />

                        {req.status === 'pending' && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                            <Button className="flex-1 bg-green-600 hover:bg-green-700" size="sm" onClick={() => openDialog(req, 'approve')}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button className="flex-1" variant="destructive" size="sm" onClick={() => openDialog(req, 'reject')}>
                              <X className="w-4 h-4 mr-1" /> Reject
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? 'Approve Request' : 'Reject Request'}</DialogTitle>
            <DialogDescription>
              {actionType === 'approve' ? 'Are you sure you want to approve this request? This will update user permissions.' : 'Please provide a reason for rejection.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="bg-gray-50 p-3 rounded text-sm mb-4">
                <div className="font-medium">{selectedRequest.user.name}</div>
                <div className="text-gray-500 capitalize">{selectedRequest.requested_role} Request</div>
                {selectedRequest.type === 'shelter_registration' && (
                  <div className="mt-2 text-blue-600 text-xs flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Shelter verification includes auto-check of registry & identity
                  </div>
                )}
              </div>
            )}
            <div>
              <Label>Notes / Reason</Label>
              <Textarea
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
                placeholder={actionType === 'reject' ? "Reason for rejection (required)..." : "Optional verification notes..."}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              onClick={handleAction}
              disabled={actionType === 'reject' && !actionNotes.trim()}
            >
              Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

