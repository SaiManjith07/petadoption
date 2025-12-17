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
import { adminApi } from '@/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopNav } from '@/components/layout/AdminTopNav';

export default function AdminChats() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatRequests, setChatRequests] = useState<any[]>([]);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [chatStats, setChatStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'chats'>('requests');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requests, chats, stats] = await Promise.all([
        adminApi.getAllChatRequests(),
        adminApi.getAllChats(),
        adminApi.getChatStats(),
      ]);
      setChatRequests(Array.isArray(requests) ? requests : []);
      
      setActiveChats(Array.isArray(chats) ? chats : []);
      setChatStats(stats || {});
    } catch (error: any) {
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
      // Use the new workflow endpoint according to workflow_verification.md
      if (approved) {
        await adminApi.approveChatRequest(parseInt(requestId));
        toast({
          title: 'Request Approved',
          description: 'The request has been forwarded to the pet owner for their approval.',
        });
      } else {
        await adminApi.rejectChatRequest(parseInt(requestId));
      toast({
          title: 'Request Rejected',
          description: 'The chat request has been rejected.',
      });
      }
      loadData();
    } catch (error: any) {
      console.error('Error responding to request:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.error || error?.response?.data?.detail || error?.message || 'Failed to respond to request',
        variant: 'destructive',
      });
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
    const matchesSearch = !searchTerm || 
      chat.roomId?.toString().includes(searchTerm) ||
      chat.petId?.toString().includes(searchTerm) ||
      chat.participants?.some((p: any) => p.toString().includes(searchTerm));
    const matchesType = typeFilter === 'all' || chat.type === typeFilter;
    return matchesSearch && matchesType;
  });

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
        <AdminTopNav 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
          onRefresh={loadData}
        />

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Chat Management</h1>
                <p className="text-gray-600 mt-1">Manage chat requests and monitor active conversations</p>
              </div>
            </div>

            {/* Stats Cards */}
            {chatStats && (
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
                    Active Chats ({activeChats.length})
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
                                          className="gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                          Approve & Forward
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Chats</h3>
                        <p className="text-gray-600">
                          {searchTerm || typeFilter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'No active chat conversations at the moment.'}
                        </p>
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
                            {filteredChats.map((chat: any, index: number) => (
                              <TableRow key={chat.roomId || chat.room_id || chat.id || chat._id || `chat-${index}`}>
                                <TableCell>
                                  <Badge variant={chat.type === 'adoption' ? 'default' : 'secondary'}>
                                    {chat.type === 'adoption' ? 'ADOPTION' : 'CLAIM'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{chat.roomId || chat.room_id || chat.id || chat._id || 'N/A'}</TableCell>
                                <TableCell className="font-mono text-xs">{chat.petId || 'N/A'}</TableCell>
                                <TableCell>
                                  {chat.participants?.length || 0} participant(s)
                                </TableCell>
                                <TableCell>{chat.messages?.length || 0}</TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {chat.createdAt
                                    ? format(new Date(chat.createdAt), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      key={`view-${chat.roomId || chat.room_id || chat.id || chat._id || index}`}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewChat(chat)}
                                      className="gap-1"
                                    >
                                      <Eye className="h-4 w-4" />
                                      View
                                    </Button>
                                    <Button
                                      key={`monitor-${chat.roomId || chat.room_id || chat.id || chat._id || index}`}
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          // Try multiple ways to get the room ID
                                          const roomId = chat.roomId || chat.room_id || chat.id || chat._id;
                                          
                                          if (!roomId) {
                                            toast({
                                              title: 'Error',
                                              description: 'Room ID not found in chat data',
                                              variant: 'destructive',
                                            });
                                            console.error('Chat object:', chat);
                                            return;
                                          }
                                          
                                          // Navigate to monitor page
                                          navigate(`/admin/chats/monitor/${roomId}`);
                                        } catch (error: any) {
                                          toast({
                                            title: 'Error',
                                            description: error.message || 'Failed to open chat monitor',
                                            variant: 'destructive',
                                          });
                                        }
                                      }}
                                      className="gap-1 bg-[#2BB6AF]/10 hover:bg-[#2BB6AF]/20 text-[#2BB6AF] border-[#2BB6AF]/30"
                                    >
                                      <Shield className="h-4 w-4" />
                                      Monitor
                                    </Button>
                                    <Button
                                      key={`close-${chat.roomId || chat.room_id || chat.id || chat._id || index}`}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const roomId = chat.roomId || chat.room_id || chat.id || chat._id;
                                        if (roomId) {
                                          handleCloseChat(roomId.toString());
                                        } else {
                                          toast({
                                            title: 'Error',
                                            description: 'Room ID not found',
                                            variant: 'destructive',
                                          });
                                        }
                                      }}
                                      className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                                    >
                                      <X className="h-4 w-4" />
                                      Close
                                    </Button>
                                    <Button
                                      key={`delete-${chat.roomId || chat.room_id || chat.id || chat._id || index}`}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const roomId = chat.roomId || chat.room_id || chat.id || chat._id;
                                        if (roomId) {
                                          handleDeleteChat(roomId.toString());
                                        } else {
                                          toast({
                                            title: 'Error',
                                            description: 'Room ID not found',
                                            variant: 'destructive',
                                          });
                                        }
                                      }}
                                      className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </Button>
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

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
  );
}

