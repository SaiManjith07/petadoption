import { useState, useEffect } from 'react';
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
import { adminAPI } from '@/services/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'chats'>('requests');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requests, chats, stats] = await Promise.all([
        adminAPI.getAllChatRequests(),
        adminAPI.getAllChats(),
        adminAPI.getChatStats(),
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
      await adminAPI.respondToChatRequest(requestId, approved);
      toast({
        title: 'Success',
        description: `Chat request ${approved ? 'approved' : 'rejected'}`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to respond to request',
        variant: 'destructive',
      });
    }
  };

  const handleViewChat = async (chat: any) => {
    try {
      const roomData = await adminAPI.getChatRoom(chat.roomId || chat._id);
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
      // This endpoint needs to be added to backend
      await adminAPI.closeChat(chatId);
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

  const filteredRequests = chatRequests.filter((req: any) => {
    const matchesSearch = !searchTerm || 
      req.petId?.toString().includes(searchTerm) ||
      req.requesterId?.toString().includes(searchTerm) ||
      req.ownerId?.toString().includes(searchTerm);
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
        {/* Mobile Menu Toggle */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          </Button>
        </div>

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
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
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
                            {filteredRequests.map((req: any) => (
                              <TableRow key={req._id || req.id}>
                                <TableCell>
                                  <Badge variant={req.type === 'adoption' ? 'default' : 'secondary'}>
                                    {req.type || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{req.petId || 'N/A'}</TableCell>
                                <TableCell>{req.requesterId || 'N/A'}</TableCell>
                                <TableCell>{req.ownerId || 'N/A'}</TableCell>
                                <TableCell>
                                  {req.status === 'pending' ? (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pending
                                    </Badge>
                                  ) : req.status === 'approved' ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Approved
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Rejected
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {req.createdAt
                                    ? format(new Date(req.createdAt), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {req.status === 'pending' && (
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRespondToRequest(req.id || req._id, true)}
                                        className="gap-1"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Approve
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRespondToRequest(req.id || req._id, false)}
                                        className="gap-1 text-red-600"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}
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
                            {filteredChats.map((chat: any) => (
                              <TableRow key={chat.roomId || chat._id}>
                                <TableCell>
                                  <Badge variant={chat.type === 'adoption' ? 'default' : 'secondary'}>
                                    {chat.type === 'adoption' ? 'ADOPTION' : 'CLAIM'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{chat.roomId || chat._id}</TableCell>
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
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewChat(chat)}
                                      className="gap-1"
                                    >
                                      <Eye className="h-4 w-4" />
                                      View
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/chat/${chat.roomId || chat._id}`)}
                                      className="gap-1"
                                    >
                                      <Shield className="h-4 w-4" />
                                      Monitor
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCloseChat(chat.roomId || chat._id)}
                                      className="gap-1 text-red-600"
                                    >
                                      <X className="h-4 w-4" />
                                      Close
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

