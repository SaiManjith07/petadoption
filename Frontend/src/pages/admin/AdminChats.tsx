import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Shield,
  MessageCircle,
  AlertCircle,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/api';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminChats() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [chatRequests, setChatRequests] = useState<any[]>([]);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [closedChats, setClosedChats] = useState<any[]>([]);
  const [chatStats, setChatStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'chats' | 'closed'>('requests');

  useEffect(() => {
    loadData();
  }, []);
  
  // Reload data when switching tabs
  useEffect(() => {
    if (activeTab === 'chats' || activeTab === 'closed') {
      console.log(`Switched to ${activeTab} tab, reloading data...`);
      loadData();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Use Promise.allSettled to handle partial failures gracefully
      const [requestsResult, chatsResult, statsResult] = await Promise.allSettled([
        adminApi.getAllChatRequests(),
        adminApi.getAllChats(),
        adminApi.getChatStats(),
      ]);
      
      // Handle requests
      if (requestsResult.status === 'fulfilled') {
        setChatRequests(Array.isArray(requestsResult.value) ? requestsResult.value : []);
      } else {
        console.error('Error loading chat requests:', requestsResult.reason);
        setChatRequests([]);
        toast({
          title: 'Warning',
          description: 'Failed to load some chat requests. Please refresh.',
          variant: 'destructive',
        });
      }
      
      // Handle chats - load both active and closed
      if (chatsResult.status === 'fulfilled') {
        const chats = Array.isArray(chatsResult.value) ? chatsResult.value : [];
        console.log('✓ Loaded chats from API:', chats.length);
        
        // Separate active and closed chats
        const active = chats.filter((c: any) => c.is_active !== false);
        const closed = chats.filter((c: any) => c.is_active === false);
        
        if (chats.length > 0) {
          console.log('Sample chat data:', JSON.stringify(chats[0], null, 2));
          console.log('Active chats:', active.length, 'Closed chats:', closed.length);
        } else {
          console.warn('⚠ No chats returned from API. Check backend logs.');
        }
        setActiveChats(active);
        setClosedChats(closed);
      } else {
        console.error('✗ Error loading chats:', chatsResult.reason);
        console.error('Error details:', chatsResult.reason?.response?.data);
        console.error('Error status:', chatsResult.reason?.response?.status);
        setActiveChats([]);
        setClosedChats([]);
      }
      
      // Also load closed chats separately if on closed tab
      if (activeTab === 'closed') {
        try {
          const closedChatsResult = await adminApi.getAllChats({ include_inactive: true });
          const allChats = Array.isArray(closedChatsResult) ? closedChatsResult : [];
          const closed = allChats.filter((c: any) => c.is_active === false);
          setClosedChats(closed);
        } catch (error) {
          console.warn('Could not load closed chats separately:', error);
        }
      }
      
      // Handle stats
      if (statsResult.status === 'fulfilled') {
        setChatStats(statsResult.value || {});
      } else {
        console.error('Error loading chat stats:', statsResult.reason);
        setChatStats({});
      }
    } catch (error: any) {
      console.error('Unexpected error in loadData:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load chat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, approved: boolean) => {
    try {
      // Use the new verification workflow
      if (approved) {
        // Start verification - creates chat room with requester and sends notification
        const requestIdNum = parseInt(requestId);
        if (isNaN(requestIdNum)) {
        toast({
            title: 'Error',
            description: 'Invalid request ID',
            variant: 'destructive',
          });
          return;
        }
        
        console.log('Starting verification for request ID:', requestIdNum);
        const result = await adminApi.startVerification(requestIdNum);
        console.log('Verification started, result:', result);
        console.log('Verification room ID:', result?.verification_room_id);
        
        toast({
          title: 'Verification Started',
          description: 'Chat room created with requester. They have been notified. You can now chat with them to verify.',
        });
        
        // Wait a moment for backend to save, then reload data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reload data immediately to show the new room in Active Chats
        console.log('Reloading data to show new verification room...');
        await loadData();
        
        // Optionally navigate to the verification chat room
        if (result?.verification_room_id) {
          const shouldNavigate = window.confirm('Verification chat room created and added to Active Chats. Would you like to open it now?');
          if (shouldNavigate) {
            navigate(`/chat/${result.verification_room_id}`);
          }
        }
      } else {
        await adminApi.rejectChatRequest(parseInt(requestId));
      toast({
          title: 'Request Rejected',
          description: 'The chat request has been rejected.',
      });
        await loadData();
      }
    } catch (error: any) {
      console.error('Error responding to request:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      
      // If room was created but there's an error, still show success
      if (error?.response?.status === 404) {
        toast({
          title: 'Warning',
          description: 'The request may have been processed, but the response was not received. Please refresh the page.',
          variant: 'destructive',
        });
      } else {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || error?.response?.data?.detail || error?.message || 'Failed to respond to request',
        variant: 'destructive',
      });
      }
      
      // Still reload data in case the operation succeeded, but with a delay to avoid race conditions
      setTimeout(() => {
        loadData();
      }, 500);
    }
  };

  const handleViewChat = async (chat: any) => {
    try {
      const roomId = chat.roomId || chat.room_id || chat.id || chat._id;
      if (!roomId) {
        toast({
          title: 'Error',
          description: 'Room ID not found in chat object',
          variant: 'destructive',
        });
        console.error('Chat object:', chat);
        return;
      }
      const roomData = await adminApi.getChatRoom(roomId);
      setSelectedChat(roomData);
      setViewDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load chat details',
        variant: 'destructive',
      });
    }
  };

  const handleCloseChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to close this chat? This action cannot be undone.')) return;
    
    try {
      await adminApi.closeChat(chatId);
      toast({
        title: 'Success',
        description: 'Chat closed successfully',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close chat',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('⚠️ WARNING: Are you sure you want to DELETE this chat room? This will permanently delete all messages and cannot be undone. This action is irreversible.')) return;
    
    if (!confirm('This is your final warning. Click OK to permanently delete this chat room and all its messages.')) return;
    
    try {
      await adminApi.deleteChat(chatId);
      toast({
        title: 'Success',
        description: 'Chat room deleted successfully',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete chat room',
        variant: 'destructive',
      });
    }
  };

  const filteredRequests = chatRequests.filter((req: any) => {
    const matchesSearch = !searchTerm || 
      req.petId?.toString().includes(searchTerm) ||
      req.pet_id?.toString().includes(searchTerm) ||
      req.pet?.id?.toString().includes(searchTerm) ||
      req.requesterId?.toString().includes(searchTerm) ||
      req.requester_id?.toString().includes(searchTerm) ||
      req.requester?.id?.toString().includes(searchTerm) ||
      req.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requester?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.targetId?.toString().includes(searchTerm) ||
      req.target_id?.toString().includes(searchTerm) ||
      req.target?.id?.toString().includes(searchTerm) ||
      req.target?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.target?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || req.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredChats = activeChats.filter((chat: any) => {
    // Only show active chats
    if (chat.is_active === false) return false;
    const roomId = chat.roomId || chat.room_id || chat.id || '';
    const petId = chat.petId || chat.pet_id || chat.pet?.id || '';
    const participants = chat.participants || [];
    
    const matchesSearch = !searchTerm || 
      roomId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      petId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      participants.some((p: any) => 
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id?.toString().includes(searchTerm)
      ) ||
      (chat.room_id || '').toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    // For verification rooms, don't filter by type (they might not have a type)
    const isVerificationRoom = roomId && String(roomId).startsWith('admin_verification_');
    const matchesType = typeFilter === 'all' || chat.type === typeFilter || isVerificationRoom;
    return matchesSearch && matchesType;
  });
  
  console.log('Active chats:', activeChats.length, 'Filtered chats:', filteredChats.length);

  return (
    <AdminLayout onRefresh={loadData}>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chat Management</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage chat requests and monitor active conversations</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {chatStats && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">{chatStats.pending_requests || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Active Chats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{chatStats.active_chats || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{chatStats.total_requests || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{chatStats.approved_requests || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{chatStats.rejected_requests || 0}</div>
                  </CardContent>
                </Card>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Card>
              <CardHeader>
                <div className="flex gap-4 border-b">
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-2 px-1 font-medium transition-colors ${
                      activeTab === 'requests'
                        ? 'border-b-2 border-green-600 text-green-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Chat Requests ({chatRequests.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('chats')}
                    className={`pb-2 px-1 font-medium transition-colors ${
                      activeTab === 'chats'
                        ? 'border-b-2 border-green-600 text-green-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Active Chats ({activeChats.length}) {activeChats.length > 0 && `(${filteredChats.length} shown)`}
                  </button>
                  <button
                    onClick={() => setActiveTab('closed')}
                    className={`pb-2 px-1 font-medium transition-colors ${
                      activeTab === 'closed'
                        ? 'border-b-2 border-gray-600 text-gray-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Closed/Reunited ({closedChats.length})
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder={
                          activeTab === 'requests'
                            ? 'Search by pet ID, requester, or owner...'
                            : 'Search by room ID, pet ID, or participant...'
                        }
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
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
                    {activeTab === 'requests' && (
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">All Status</option>
                      <option value="pending">Pending Admin</option>
                      <option value="admin_verifying">Verifying</option>
                      <option value="admin_approved">Admin Approved</option>
                      <option value="active">Active</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadData}
                      className="gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Chat Requests Tab */}
                {activeTab === 'requests' && (
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="mt-4 text-gray-600">Loading requests...</p>
                      </div>
                    ) : filteredRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Chat Requests</h3>
                        <p className="text-gray-600">
                          {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'No chat requests at the moment.'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Pet ID</TableHead>
                              <TableHead>Requester</TableHead>
                              <TableHead>Owner</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRequests.map((req: any, index: number) => (
                              <TableRow key={req._id || req.id || `request-${index}`}>
                                <TableCell>
                                  <Badge variant={req.type === 'adoption' ? 'default' : 'secondary'}>
                                    {req.type || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {req.pet?.id || req.petId || req.pet_id || 'N/A'}
                                  {req.pet?.name && (
                                    <span className="text-xs text-gray-500 block normal-case">{req.pet.name}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {req.requester?.name || req.requesterId || 'N/A'}
                                  {req.requester?.email && (
                                    <span className="text-xs text-gray-500 block">{req.requester.email}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {req.target?.name || req.targetId || req.pet?.posted_by?.name || 'N/A'}
                                  {req.target?.email && (
                                    <span className="text-xs text-gray-500 block">{req.target.email}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {req.status === 'pending' ? (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pending Admin
                                    </Badge>
                                  ) : req.status === 'admin_verifying' ? (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Verifying
                                    </Badge>
                                  ) : req.status === 'admin_approved' ? (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Admin Approved
                                    </Badge>
                                  ) : req.status === 'active' ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Rejected
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {req.created_at || req.createdAt
                                    ? format(new Date(req.created_at || req.createdAt), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        key={`view-${req._id || req.id || index}`}
                                        variant="outline"
                                        size="sm"
                                      onClick={() => {
                                        setSelectedRequest(req);
                                        setRequestDialogOpen(true);
                                      }}
                                        className="gap-1"
                                    >
                                      <Eye className="h-4 w-4" />
                                      View
                                    </Button>
                                    {req.status === 'pending' && (
                                      <React.Fragment key={`pending-actions-${req._id || req.id || index}`}>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleRespondToRequest(req.id || req._id, true)}
                                          className="gap-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                                      >
                                        <Shield className="h-4 w-4" />
                                          Verify
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRespondToRequest(req.id || req._id, false)}
                                          className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Reject
                                      </Button>
                                      </React.Fragment>
                                    )}
                                    {req.status === 'admin_verifying' && (
                                      <React.Fragment key={`verifying-actions-${req._id || req.id || index}`}>
                                        {(req.admin_verification_room?.room_id || req.admin_verification_room?.id) && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const roomId = req.admin_verification_room?.room_id || req.admin_verification_room?.id || req.admin_verification_room;
                                              console.log('Opening verification chat. Request:', req);
                                              console.log('Admin verification room:', req.admin_verification_room);
                                              console.log('Room ID to navigate:', roomId);
                                              if (roomId) {
                                                try {
                                                  navigate(`/chat/${roomId}`);
                                                } catch (error) {
                                                  console.error('Navigation error:', error);
                                                  toast({
                                                    title: 'Navigation Error',
                                                    description: 'Failed to navigate to chat. Error: ' + (error as Error).message,
                                                    variant: 'destructive',
                                                  });
                                                }
                                              } else {
                                                toast({
                                                  title: 'Error',
                                                  description: 'Room ID not found. Please refresh the page. Request data: ' + JSON.stringify(req),
                                                  variant: 'destructive',
                                                });
                                              }
                                            }}
                                            className="gap-1"
                                          >
                                            <MessageSquare className="h-4 w-4" />
                                            Open Chat
                                          </Button>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={async () => {
                                            try {
                                              await adminApi.completeVerification(
                                                parseInt(req.id || req._id),
                                                req.target?.id || req.target_id,
                                                ''
                                              );
                                              toast({
                                                title: 'Verification Complete',
                                                description: 'Target user added to chat room. All users can now communicate.',
                                              });
                                              loadData();
                                            } catch (error: any) {
                                              toast({
                                                title: 'Error',
                                                description: error?.response?.data?.error || error?.message || 'Failed to complete verification',
                                                variant: 'destructive',
                                              });
                                            }
                                          }}
                                          className="gap-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                                        >
                                          <ArrowRight className="h-4 w-4" />
                                          Forward & Add User
                                      </Button>
                                      </React.Fragment>
                                    )}
                                    {req.status === 'admin_approved' && (
                                      <Badge key={`badge-${req._id || req.id || index}`} variant="outline" className="bg-blue-50 text-blue-700">
                                        Waiting for Owner
                                      </Badge>
                                    )}
                                    </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}

                {/* Active Chats Tab */}
                {activeTab === 'chats' && (
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="mt-4 text-gray-600">Loading chats...</p>
                      </div>
                    ) : filteredChats.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {activeChats.length === 0 ? 'No Active Chats' : 'No Chats Match Filters'}
                        </h3>
                        <p className="text-gray-600">
                          {searchTerm || typeFilter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : activeChats.length === 0 
                              ? 'No active chat conversations at the moment. Click "Verify" on a chat request to create a verification room.'
                              : `${activeChats.length} chat(s) found but filtered out.`}
                        </p>
                        {activeChats.length > 0 && (
                          <p className="text-sm text-gray-500 mt-2">
                            Total chats loaded: {activeChats.length} | Filtered: {filteredChats.length}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Room ID</TableHead>
                              <TableHead>Pet ID</TableHead>
                              <TableHead>Participants</TableHead>
                              <TableHead>Messages</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredChats.map((chat: any, index: number) => {
                              const roomId = chat.roomId || chat.room_id || chat.id || chat._id;
                              const isVerificationRoom = roomId && String(roomId).startsWith('admin_verification_');
                              const participants = chat.participants || [];
                              
                              return (
                              <TableRow key={roomId || `chat-${index}`}>
                                <TableCell>
                                  {isVerificationRoom ? (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                      <Shield className="h-3 w-3 mr-1" />
                                      VERIFICATION
                                    </Badge>
                                  ) : (
                                  <Badge 
                                    variant={
                                      chat.type === 'adoption' 
                                        ? 'default' 
                                        : chat.type === 'normal'
                                          ? 'outline'
                                          : 'secondary'
                                    }
                                    className={
                                      chat.type === 'normal'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : ''
                                    }
                                  >
                                    {chat.type === 'adoption' 
                                      ? 'ADOPTION' 
                                      : chat.type === 'normal' 
                                        ? 'NORMAL' 
                                        : chat.type === 'claim'
                                          ? 'CLAIM'
                                          : (chat.type || 'NORMAL').toUpperCase()}
                                  </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{roomId || 'N/A'}</TableCell>
                                <TableCell className="font-mono text-xs">{chat.pet_id || chat.petId || chat.pet?.id || 'N/A'}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{participants.length} participant(s)</span>
                                    {participants.length > 0 && (
                                      <span className="text-xs text-gray-500">
                                        {participants.slice(0, 3).map((p: any) => {
                                          const name = p.name || p.email || `User ${p.id}`;
                                          const isAdmin = p.is_staff || p.is_superuser;
                                          return `${name}${isAdmin ? ' (admin)' : ' (user)'}`;
                                        }).join(', ')}
                                        {participants.length > 3 && ` +${participants.length - 3} more`}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{chat.messages?.length || chat.last_message ? 1 : 0}</TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {chat.created_at || chat.createdAt
                                    ? format(new Date(chat.created_at || chat.createdAt), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {(() => {
                                      const currentUserId = user?.id || user?._id || user?.user_id;
                                      
                                      // Check if current admin is a participant in the room
                                      const isParticipant = participants && participants.length > 0 && participants.some((p: any) => {
                                        const participantId = p.id || p._id || p.user_id;
                                        return participantId && currentUserId && String(participantId) === String(currentUserId);
                                      });
                                      
                                      // Check if current admin is the verifying admin (for pet-related chats)
                                      const isVerifyingAdmin = chat.chat_request?.verified_by_admin?.id === currentUserId ||
                                                               chat.verified_by_admin_id === currentUserId ||
                                                               chat.created_by_admin_id === currentUserId;
                                      
                                      const roomIdToOpen = roomId || chat.roomId || chat.room_id || chat.id || chat._id;
                                      
                                      // Check if current admin is the creator (who activated/verified the chat)
                                      // Also check if created_by_admin_id matches (with type coercion)
                                      const isCreator = chat.created_by_admin_id === user?.id ||
                                                        (chat.created_by_admin_id && user?.id && String(chat.created_by_admin_id) === String(user.id));
                                      
                                      // Debug logging
                                      console.log('Chat permission check:', {
                                        roomId: roomIdToOpen,
                                        currentUserId,
                                        isParticipant,
                                        isCreator,
                                        isVerifyingAdmin,
                                        created_by_admin_id: chat.created_by_admin_id,
                                        participants: participants?.map((p: any) => ({ id: p.id, name: p.name })),
                                      });
                                      
                                      // If admin is the creator OR is a participant OR is the verifying admin, they can open full chat
                                      if (isCreator || isParticipant || isVerifyingAdmin) {
                                        return (
                                          <Button
                                            key={`view-${roomId || index}`}
                                            variant="default"
                                            size="sm"
                                            onClick={() => {
                                              if (roomIdToOpen) {
                                                navigate(`/chat/${roomIdToOpen}`);
                                              } else {
                                                toast({
                                                  title: 'Error',
                                                  description: 'Room ID not found',
                                                  variant: 'destructive',
                                                });
                                              }
                                            }}
                                            className="gap-1"
                                          >
                                            <MessageSquare className="h-4 w-4" />
                                            Open Chat
                                          </Button>
                                        );
                                      } else {
                                        // Other admins (not creator, not participants) can only view in read-only mode
                                        return (
                                          <Button
                                            key={`view-readonly-${roomId || index}`}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              if (roomIdToOpen) {
                                                navigate(`/admin/chats/view/${roomIdToOpen}`);
                                              } else {
                                                toast({
                                                  title: 'Error',
                                                  description: 'Room ID not found',
                                                  variant: 'destructive',
                                                });
                                              }
                                            }}
                                            className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                          >
                                            <Eye className="h-4 w-4" />
                                            View Only
                                          </Button>
                                        );
                                      }
                                    })()}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}

                {/* Closed/Reunited Chats Tab */}
                {activeTab === 'closed' && (
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                        <p className="mt-4 text-gray-600">Loading closed chats...</p>
                      </div>
                    ) : closedChats.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Closed Chats</h3>
                        <p className="text-gray-600">
                          No closed or reunited chats at the moment.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Room ID</TableHead>
                              <TableHead>Pet</TableHead>
                              <TableHead>Participants</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Closed Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {closedChats.map((chat: any, index: number) => {
                              const roomId = chat.roomId || chat.room_id || chat.id || chat._id;
                              const pet = chat.pet || chat.chat_request?.pet;
                              const participants = chat.participants || [];
                              
                              return (
                                <TableRow key={roomId || `closed-chat-${index}`} className="opacity-75">
                                  <TableCell>
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                      {chat.type || 'General'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-mono text-sm">{roomId}</span>
                                  </TableCell>
                                  <TableCell>
                                    {pet ? (
                                      <div>
                                        <p className="text-sm font-medium">
                                          {pet.name || `Pet #${pet.id}`}
                                        </p>
                                        <Badge 
                                          variant={pet.adoption_status === 'Reunited' ? 'default' : 'outline'}
                                          className={pet.adoption_status === 'Reunited' ? 'bg-green-100 text-green-700' : ''}
                                        >
                                          {pet.adoption_status || 'N/A'}
                                        </Badge>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">N/A</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      {participants.slice(0, 2).map((p: any) => (
                                        <span key={p.id || p} className="text-sm">
                                          {p.name || p.email || p}
                                        </span>
                                      ))}
                                      {participants.length > 2 && (
                                        <span className="text-xs text-gray-500">+{participants.length - 2} more</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Closed/Reunited
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {chat.updated_at ? format(new Date(chat.updated_at), 'MMM d, yyyy') : 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const roomIdToOpen = chat.roomId || chat.room_id || chat.id;
                                        if (roomIdToOpen) {
                                          navigate(`/admin/chats/view/${roomIdToOpen}`);
                                        }
                                      }}
                                      className="gap-1"
                                    >
                                      <Eye className="h-4 w-4" />
                                      View
                                    </Button>
                                </TableCell>
                              </TableRow>
                            );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

        {/* View Request Dialog */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chat Request Details</DialogTitle>
              <DialogDescription>Complete information about the chat request</DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Request ID</p>
                  <p className="text-sm font-mono">{selectedRequest.id || selectedRequest._id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Type</p>
                  <Badge variant={selectedRequest.type === 'adoption' ? 'default' : 'secondary'}>
                    {selectedRequest.type || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  {selectedRequest.status === 'pending' ? (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Admin Approval
                    </Badge>
                  ) : selectedRequest.status === 'admin_approved' ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      <Clock className="h-3 w-3 mr-1" />
                      Admin Approved - Pending Owner
                    </Badge>
                  ) : selectedRequest.status === 'active' ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active Chat
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pet ID</p>
                  <p className="text-sm font-mono">{selectedRequest.pet?.id || selectedRequest.petId || selectedRequest.pet_id || 'N/A'}</p>
                  {selectedRequest.pet?.name && (
                    <p className="text-xs text-gray-500">{selectedRequest.pet.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Requester</p>
                  <p className="text-sm">
                    {selectedRequest.requester?.name || selectedRequest.requesterId || 'N/A'}
                  </p>
                  {selectedRequest.requester?.email && (
                    <p className="text-xs text-gray-500">{selectedRequest.requester.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pet Owner (Target)</p>
                  <p className="text-sm">
                    {selectedRequest.target?.name || selectedRequest.targetId || 'N/A'}
                  </p>
                  {selectedRequest.target?.email && (
                    <p className="text-xs text-gray-500">{selectedRequest.target.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-sm">
                    {selectedRequest.created_at || selectedRequest.createdAt
                      ? format(new Date(selectedRequest.created_at || selectedRequest.createdAt), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </p>
                </div>
                {(selectedRequest.updated_at || selectedRequest.updatedAt) && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="text-sm">
                      {format(new Date(selectedRequest.updated_at || selectedRequest.updatedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </div>
              {selectedRequest.message && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Request Message</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.message}</p>
                  </div>
                </div>
              )}
              {selectedRequest.admin_notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Admin Notes</p>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.admin_notes}</p>
                  </div>
                </div>
              )}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleRespondToRequest(selectedRequest.id || selectedRequest._id, true);
                      setRequestDialogOpen(false);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Forward to Owner
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleRespondToRequest(selectedRequest.id || selectedRequest._id, false);
                      setRequestDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Chat Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chat Details</DialogTitle>
              <DialogDescription>Complete information about the chat conversation</DialogDescription>
            </DialogHeader>
            {selectedChat && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Room ID</p>
                    <p className="text-sm font-mono">{selectedChat.room_id || selectedChat.roomId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Type</p>
                    <Badge variant={selectedChat.type === 'adoption' ? 'default' : 'secondary'}>
                      {selectedChat.type || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pet ID</p>
                    <p className="text-sm font-mono">{selectedChat.pet_id?._id || selectedChat.petId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Participants</p>
                    <p className="text-sm">{selectedChat.participants?.length || 0}</p>
                  </div>
                </div>
                {selectedChat.messages && selectedChat.messages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Messages ({selectedChat.messages.length})</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                      {selectedChat.messages.map((msg: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium">{msg.sender?.name || 'Unknown'}</p>
                          <p className="text-gray-700">{msg.text || msg.message}</p>
                          <p className="text-xs text-gray-500">
                            {msg.timestamp ? format(new Date(msg.timestamp), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

