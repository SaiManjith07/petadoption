import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Clock, CheckCircle, XCircle, Heart, Search, ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { chatApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ChatList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Also reload when tab changes to ensure fresh data
  useEffect(() => {
    if (activeTab === 'incoming' && user) {
      loadData();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chatsData, incomingRequestsData, myRequestsData] = await Promise.allSettled([
        chatApi.getRooms(),
        chatApi.getChatRequestsForOwner(), // Requests where user is target (can accept)
        chatApi.getMyChatRequests(), // Requests user made (outgoing)
      ]);
      
      // Handle chats result
      if (chatsData.status === 'fulfilled') {
        const chatsValue = chatsData.value;
        // Ensure it's always an array
        if (Array.isArray(chatsValue)) {
          setChats(chatsValue);
        } else if (chatsValue && Array.isArray(chatsValue.data)) {
          setChats(chatsValue.data);
        } else if (chatsValue && Array.isArray(chatsValue.results)) {
          setChats(chatsValue.results);
        } else {
          console.warn('Unexpected chats data format:', chatsValue);
          setChats([]);
        }
      } else {
        console.error('Error loading chats:', chatsData.reason);
        setChats([]);
      }
      
      // Handle incoming requests (where user is target)
      let incoming: any[] = [];
      let outgoing: any[] = [];
      
      if (incomingRequestsData.status === 'fulfilled') {
        const incomingValue = incomingRequestsData.value;
        // Handle different response formats
        if (Array.isArray(incomingValue)) {
          incoming = incomingValue;
        } else if (incomingValue && Array.isArray(incomingValue.data)) {
          incoming = incomingValue.data;
        } else {
          incoming = [];
        }
      } else {
        console.error('Error loading incoming requests:', incomingRequestsData.reason);
      }
      
      // Handle outgoing requests (requests user made)
      if (myRequestsData.status === 'fulfilled') {
        const outgoingValue = myRequestsData.value;
        // Handle different response formats
        if (Array.isArray(outgoingValue)) {
          outgoing = outgoingValue;
        } else if (outgoingValue && Array.isArray(outgoingValue.data)) {
          outgoing = outgoingValue.data;
        } else {
          outgoing = [];
        }
      } else {
        console.error('Error loading outgoing requests:', myRequestsData.reason);
      }
      
      // Combine both, but mark which is which
      // Filter incoming to only show admin_approved ones
      const adminApprovedIncoming = incoming.filter((r: any) => r.status === 'admin_approved');
      
      setRequests([
        ...adminApprovedIncoming.map((r: any) => ({ 
          ...r, 
          isIncoming: true,
          // Ensure target_id is set correctly
          target_id: r.target_id || user?.id
        })),
        ...outgoing.map((r: any) => ({ 
          ...r, 
          isIncoming: false,
          // Ensure requester_id is set correctly
          requester_id: r.requester_id || user?.id
        }))
      ]);
    } catch (error: any) {
      console.error('Unexpected error loading data:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Could not load chats or requests',
        variant: 'destructive',
      });
      setChats([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string | number) => {
    try {
      const result = await chatApi.respondToOwnerChatRequest(requestId, true);
      if (result) {
        toast({
          title: 'Chat Request Accepted',
          description: result.message || 'Chat room has been created. You can now communicate.',
        });
        // Reload data after a short delay to ensure backend has processed
        setTimeout(() => {
          loadData();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.error || error?.message || 'Could not approve chat request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (requestId: string | number) => {
    try {
      const result = await chatApi.respondToOwnerChatRequest(requestId, false);
      toast({
        title: 'Chat Request Rejected',
        description: result?.message || 'The request has been declined.',
      });
      // Reload data after a short delay
      setTimeout(() => {
        loadData();
      }, 500);
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.error || error?.message || 'Could not reject chat request',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading chats...</p>
        </div>
      </div>
    );
  }

  // Separate incoming and outgoing requests (ensure requests is an array)
  // Incoming requests: where user is the target and status is admin_approved
  const incomingRequests = Array.isArray(requests) ? requests.filter((r: any) => {
    if (!r) return false;
    // Check if this is an incoming request (user is target)
    const isIncoming = r.isIncoming === true || 
                       r.target_id === user?.id || 
                       r.targetId === user?.id || 
                       r.target?._id === user?.id || 
                       r.target?.id === user?.id ||
                       (r.requester_id !== user?.id && r.requesterId !== user?.id);
    // Must be admin_approved status
    const isAdminApproved = r.status === 'admin_approved';
    return isIncoming && isAdminApproved;
  }) : [];
  
  // Outgoing requests: where user is the requester
  const outgoingRequests = Array.isArray(requests) ? requests.filter((r: any) => {
    if (!r) return false;
    return r.isIncoming === false || 
           r.requester_id === user?.id || 
           r.requesterId === user?.id || 
           r.requester?._id === user?.id || 
           r.requester?.id === user?.id;
  }) : [];
  
  // Filter chats: show all active chats
  const activeChats = chats.filter(c => c.roomId || c.room_id || c.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Chats</h1>
          <p className="text-gray-600">Manage your conversations and chat requests</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Active Chats ({activeChats.length})
            </TabsTrigger>
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Incoming ({incomingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              My Requests ({outgoingRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="mt-6">
            {activeChats.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No active chats</h3>
                  <p className="text-gray-600 text-center mb-6">
                    You don't have any active chat conversations yet.
                  </p>
                  <Button onClick={() => navigate('/pets/found')}>
                    Browse Found Pets
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeChats.map((chat) => (
                  <Card key={chat.roomId || chat.room_id || chat.id || `chat-${chat.roomId}`} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {chat.type === 'adoption' ? (
                              <Heart className="h-5 w-5 text-pink-500" />
                            ) : (
                              <Search className="h-5 w-5 text-orange-500" />
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">
                              {chat.type === 'adoption' ? 'Adoption Chat' : 'Pet Claim Chat'}
                            </h3>
                            <Badge variant={chat.type === 'adoption' ? 'default' : 'secondary'}>
                              {chat.type === 'adoption' ? 'Adoption' : 'Claim'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Pet ID: {chat.petId}
                          </p>
                          {chat.messages && chat.messages.length > 0 && (
                            <p className="text-sm text-gray-500 line-clamp-2">
                              Last message: {chat.messages[chat.messages.length - 1].text}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Created: {format(new Date(chat.createdAt || Date.now()), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            // Use room_id if available, otherwise use roomId or id
                            const roomId = chat.room_id || chat.roomId || chat.id;
                            if (roomId) {
                              navigate(`/chat/${roomId}`);
                            } else {
                              toast({
                                title: 'Error',
                                description: 'Chat room ID not found',
                                variant: 'destructive',
                              });
                            }
                          }}
                          className="ml-4"
                        >
                          Open Chat
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="incoming" className="mt-6">
            {incomingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No incoming requests</h3>
                  <p className="text-gray-600 text-center">
                    You don't have any pending chat requests waiting for your approval.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    (Admin-approved requests will appear here for you to accept or reject)
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {incomingRequests.map((request) => (
                  <Card key={request.id} className="border-2 border-orange-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {request.type === 'adoption' ? (
                              <Heart className="h-5 w-5 text-pink-500" />
                            ) : (
                              <Search className="h-5 w-5 text-orange-500" />
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.type === 'adoption' ? 'Adoption Request' : 'Pet Claim Request'}
                            </h3>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              Pending
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Pet ID: {request.pet?.id || request.petId || request.pet_id || 'N/A'}
                            {request.pet?.name && (
                              <span className="text-xs text-gray-500 ml-2">({request.pet.name})</span>
                            )}
                          </p>
                          {request.message && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700">{request.message}</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mb-2">
                            Requested: {format(new Date(request.created_at || request.createdAt || Date.now()), 'MMM d, yyyy HH:mm')}
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs text-blue-600 font-medium">
                              From: {request.requester_name || request.requester?.name || request.requesterId?.name || 
                                (typeof request.requesterId === 'object' && request.requesterId?.name 
                                  ? request.requesterId.name 
                                  : `User #${request.requester_id || request.requesterId || 'Unknown'}`)}
                            </p>
                            {request.requester?.email && (
                              <p className="text-xs text-gray-500">{request.requester.email}</p>
                            )}
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              ✓ Admin Approved - Waiting for Your Response
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4 min-w-[140px]">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setViewDialogOpen(true);
                            }}
                            className="mb-2"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            onClick={() => {
                              if (request.id) {
                                handleApproveRequest(request.id);
                              } else {
                                toast({
                                  title: 'Error',
                                  description: 'Request ID not found',
                                  variant: 'destructive',
                                });
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                            disabled={!request.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => {
                              if (request.id) {
                                handleRejectRequest(request.id);
                              } else {
                                toast({
                                  title: 'Error',
                                  description: 'Request ID not found',
                                  variant: 'destructive',
                                });
                              }
                            }}
                            variant="destructive"
                            size="sm"
                            disabled={!request.id}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="mt-6">
            {outgoingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ArrowRight className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No outgoing requests</h3>
                  <p className="text-gray-600 text-center mb-6">
                    You haven't made any chat requests yet.
                  </p>
                  <Button onClick={() => navigate('/pets/found')}>
                    Browse Pets
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {outgoingRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className={`border-2 ${
                      request.status === 'active' ? 'border-green-200 bg-green-50' :
                      request.status === 'admin_approved' ? 'border-blue-200 bg-blue-50' :
                      request.status === 'rejected' ? 'border-red-200 bg-red-50' :
                      'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {request.type === 'adoption' ? (
                              <Heart className="h-5 w-5 text-pink-500" />
                            ) : (
                              <Search className="h-5 w-5 text-orange-500" />
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.type === 'adoption' ? 'Adoption Request' : 'Pet Claim Request'}
                            </h3>
                            <Badge 
                              variant={
                                request.status === 'active' ? 'default' :
                                request.status === 'admin_approved' ? 'secondary' :
                                request.status === 'rejected' ? 'destructive' :
                                'outline'
                              }
                              className={
                                request.status === 'active' ? 'bg-green-600' :
                                request.status === 'admin_approved' ? 'bg-blue-600' :
                                request.status === 'rejected' ? 'bg-red-600' :
                                'bg-yellow-600'
                              }
                            >
                              {request.status === 'active' ? 'Active Chat' :
                               request.status === 'admin_approved' ? 'Waiting for Owner' :
                               request.status === 'rejected' ? 'Rejected' :
                               request.status === 'pending' ? 'Pending Admin' :
                               request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Pet ID: {request.pet?.id || request.petId || request.pet_id || 'N/A'}
                            {request.pet?.name && (
                              <span className="text-xs text-gray-500 ml-2">({request.pet.name})</span>
                            )}
                          </p>
                          {request.message && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700">{request.message}</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mb-2">
                            Requested: {format(new Date(request.created_at || request.createdAt || Date.now()), 'MMM d, yyyy HH:mm')}
                          </p>
                          {request.status === 'active' && (
                            <div className="mt-3">
                              <Button
                                onClick={() => {
                                  const roomId = request.chat_room?.room_id || request.chat_room?.id || request.room_id;
                                  if (roomId) {
                                    navigate(`/chat/${roomId}`);
                                  } else {
                                    toast({
                                      title: 'Error',
                                      description: 'Chat room not found',
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Open Chat
                              </Button>
                            </div>
                          )}
                          {request.status === 'admin_approved' && (
                            <div className="mt-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                ✓ Admin Approved - Waiting for Pet Owner Response
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chat Request Details</DialogTitle>
            <DialogDescription>Review the request before approving or rejecting</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Request Type</p>
                  <Badge variant={selectedRequest.type === 'adoption' ? 'default' : 'secondary'} className="mt-1">
                    {selectedRequest.type === 'adoption' ? 'Adoption' : 'Claim'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Admin Approved - Awaiting Your Response
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pet ID</p>
                  <p className="text-sm font-mono">{selectedRequest.petId || selectedRequest.pet_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Requested On</p>
                  <p className="text-sm">
                    {selectedRequest.createdAt
                      ? format(new Date(selectedRequest.createdAt), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-600 mb-1">Requester Information</p>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-semibold">
                      {selectedRequest.requester?.name || 
                       selectedRequest.requesterId?.name || 
                       (typeof selectedRequest.requesterId === 'object' && selectedRequest.requesterId?.name 
                         ? selectedRequest.requesterId.name 
                         : 'User')}
                    </p>
                    {selectedRequest.requester?.email && (
                      <p className="text-xs text-gray-500 mt-1">{selectedRequest.requester.email}</p>
                    )}
                  </div>
                </div>
              </div>
              {selectedRequest.message && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Request Message</p>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.message}</p>
                  </div>
                </div>
              )}
              {selectedRequest.admin_notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Admin Notes</p>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.admin_notes}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    handleApproveRequest(selectedRequest.id);
                    setViewDialogOpen(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Create Chat
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleRejectRequest(selectedRequest.id);
                    setViewDialogOpen(false);
                  }}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


