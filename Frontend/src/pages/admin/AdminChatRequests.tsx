import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, CheckCircle, XCircle, Clock, Shield, ArrowRight, Eye, Search, RefreshCw, Filter } from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { chatApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton, Skeleton } from '@/components/ui/skeletons';

export default function AdminChatRequests() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<'start-verification' | 'complete-verification' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadRequests();
    } else if (isAuthenticated && !isAdmin) {
      navigate('/home');
    } else {
      navigate('/auth/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);
  
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadRequests();
    }
  }, [activeTab, searchTerm, typeFilter, statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // Get all chat requests - admin endpoint
      const apiClient = (await import('@/api/apiClient')).default;
      const response = await apiClient.get('/chats/requests/all/');
      const allRequests = response.data.data || response.data || [];
      
      // Filter by status (if using tabs, but we're using filters now)
      let filtered = allRequests;
      if (activeTab === 'pending') {
        filtered = filtered.filter((r: any) => r.status === 'pending');
      } else if (activeTab === 'verifying') {
        filtered = filtered.filter((r: any) => r.status === 'admin_verifying');
      } else if (activeTab === 'approved') {
        filtered = filtered.filter((r: any) => r.status === 'admin_approved');
      }
      
      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter((r: any) => {
          const searchLower = searchTerm.toLowerCase();
          return (
            r.pet_id?.toString().includes(searchLower) ||
            r.pet?.id?.toString().includes(searchLower) ||
            r.requester?.name?.toLowerCase().includes(searchLower) ||
            r.requester?.email?.toLowerCase().includes(searchLower) ||
            r.target?.name?.toLowerCase().includes(searchLower) ||
            r.target?.email?.toLowerCase().includes(searchLower) ||
            r.pet?.name?.toLowerCase().includes(searchLower)
          );
        });
      }
      
      // Apply type filter
      if (typeFilter !== 'all') {
        filtered = filtered.filter((r: any) => r.type === typeFilter);
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter((r: any) => r.status === statusFilter);
      }
      
      setRequests(filtered);
    } catch (error: any) {
      console.error('Error loading chat requests:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to load chat requests',
        variant: 'destructive',
      });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = async (request: any) => {
    setSelectedRequest(request);
    setActionType('start-verification');
    setShowDialog(true);
  };

  const handleCompleteVerification = async (request: any) => {
    setSelectedRequest(request);
    setActionType('complete-verification');
    setShowDialog(true);
  };

  const handleReject = async (request: any) => {
    setSelectedRequest(request);
    setActionType('reject');
    setShowDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      if (actionType === 'start-verification') {
        const result = await chatApi.adminStartVerification(selectedRequest.id);
        toast({
          title: 'Verification Started',
          description: 'Chat room created with requester. Open the chat to verify them. You can share images during verification.',
        });
        if (result.verification_room_id) {
          // Optionally navigate to chat
          const shouldNavigate = window.confirm('Verification chat room created. Would you like to open it now?');
          if (shouldNavigate) {
            navigate(`/chat/${result.verification_room_id}`);
          }
        }
      } else if (actionType === 'complete-verification') {
        // Get target_user_id from input, request, or admin_notes
        let finalTargetUserId = targetUserId ? parseInt(targetUserId) : 
                                selectedRequest.target?.id || 
                                selectedRequest.target_id ||
                                null;
        
        // Try to extract from admin_notes if not provided
        if (!finalTargetUserId && selectedRequest.admin_notes) {
          const match = selectedRequest.admin_notes.match(/Target user ID: (\d+)/);
          if (match) {
            finalTargetUserId = parseInt(match[1]);
          }
        }
        
        if (!finalTargetUserId) {
          toast({
            title: 'Error',
            description: 'Target user ID is required. Please provide it in the form.',
            variant: 'destructive',
          });
          return;
        }
        
        const result = await chatApi.adminCompleteVerification(
          selectedRequest.id, 
          adminNotes,
          finalTargetUserId
        );
        toast({
          title: 'Verification Complete',
          description: 'Target user added to chat room. All three users (requester, target, and you) can now communicate together.',
        });
        if (result.final_room_id) {
          navigate(`/chat/${result.final_room_id}`);
        }
      } else if (actionType === 'reject') {
        const apiClient = (await import('@/api/apiClient')).default;
        await apiClient.patch(`/chats/requests/${selectedRequest.id}/admin-reject/`, {
          admin_notes: adminNotes,
        });
        toast({
          title: 'Request Rejected',
          description: 'The chat request has been rejected.',
        });
      }
      
      setShowDialog(false);
      setAdminNotes('');
      setTargetUserId('');
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to process request',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <TableSkeleton rows={6} columns={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <AdminSidebar />
      <div className="lg:pl-64">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat Request Management</h1>
            <p className="text-gray-600">Manage and verify chat requests between users</p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by pet ID, requester, or owner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="claim">Claim</option>
                    <option value="adoption">Adoption</option>
                    <option value="general">General</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="admin_verifying">Verifying</option>
                    <option value="admin_approved">Approved</option>
                    <option value="active">Active</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadRequests}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table View */}
          <Card>
            <CardContent className="p-0">
              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests</h3>
                  <p className="text-gray-600 text-center">No chat requests found matching your filters.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Pet ID</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Badge 
                            variant={request.type === 'adoption' ? 'default' : 'secondary'}
                            className={request.type === 'claim' ? 'bg-orange-100 text-orange-700' : ''}
                          >
                            {request.type || 'general'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.pet_id || request.pet?.id || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{request.pet?.name || request.pet?.species || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.requester?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{request.requester?.email || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.target?.name || request.target?.email || 'Not set'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {request.target?.email && request.target?.name ? request.target.email : ''}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === 'pending' ? 'outline' :
                              request.status === 'admin_verifying' ? 'secondary' :
                              request.status === 'admin_approved' ? 'default' :
                              request.status === 'active' ? 'default' : 'destructive'
                            }
                            className={
                              request.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              request.status === 'admin_approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              request.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : ''
                            }
                          >
                            {request.status === 'pending' ? (
                              <>
                                <Clock className="h-3 w-3 mr-1 inline" />
                                Pending Admin
                              </>
                            ) : request.status === 'admin_verifying' ? (
                              <>
                                <Clock className="h-3 w-3 mr-1 inline" />
                                Verifying
                              </>
                            ) : request.status === 'admin_approved' ? (
                              <>
                                <Clock className="h-3 w-3 mr-1 inline" />
                                Admin Approved
                              </>
                            ) : request.status === 'active' ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1 inline" />
                                Active
                              </>
                            ) : (
                              request.status
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.created_at || Date.now()), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDialog(true);
                                setActionType(null);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => handleStartVerification(request)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  size="sm"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>
                                <Button
                                  onClick={() => handleReject(request)}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {request.status === 'admin_verifying' && (
                              <>
                                {request.admin_verification_room?.room_id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/chat/${request.admin_verification_room.room_id}`)}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Chat
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleCompleteVerification(request)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  size="sm"
                                >
                                  <ArrowRight className="h-4 w-4 mr-1" />
                                  Forward & Add User
                                </Button>
                              </>
                            )}
                            {request.status === 'admin_approved' && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Waiting for Owner
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'start-verification' && 'Start Verification'}
              {actionType === 'complete-verification' && 'Complete Verification'}
              {actionType === 'reject' && 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'start-verification' && 'This will create a chat room between you and the requester. Chat with them to verify their identity. You can share images during verification. Once verified, click "Complete Verification" to add the target user to the chat.'}
              {actionType === 'complete-verification' && 'After verifying the requester, this will add the target user to the existing chat room. All three users (requester, target, and you) will be able to chat together.'}
              {actionType === 'reject' && 'Are you sure you want to reject this chat request?'}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Request Details</p>
                <p className="text-xs text-gray-600">
                  From: {selectedRequest.requester?.name || 'Unknown'} → To: {selectedRequest.target?.name || 'Unknown'}
                </p>
                {selectedRequest.message && (
                  <p className="text-xs text-gray-600 mt-2">{selectedRequest.message}</p>
                )}
              </div>
              {actionType === 'complete-verification' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Target User ID *</label>
                    <Input
                      type="number"
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      placeholder={selectedRequest.target?.id?.toString() || selectedRequest.target_id?.toString() || "Enter target user ID"}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedRequest.target ? 
                        `Current: ${selectedRequest.target.id || selectedRequest.target_id}` :
                        'User ID of the pet owner/finder to add to the chat room'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Admin Notes (Optional)</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add any notes about this verification..."
                      rows={3}
                    />
                  </div>
                </>
              )}
              {actionType === 'reject' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Admin Notes (Optional)</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes about this request..."
                    rows={3}
                  />
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={confirmAction}
                  className={
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    actionType === 'complete-verification' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-purple-600 hover:bg-purple-700'
                  }
                >
                  {actionType === 'start-verification' && 'Verify'}
                  {actionType === 'complete-verification' && 'Complete & Create Chat'}
                  {actionType === 'reject' && 'Reject Request'}
                </Button>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

