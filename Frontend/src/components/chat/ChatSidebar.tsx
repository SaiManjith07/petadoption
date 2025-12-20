import { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { chatApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { format } from 'date-fns';

interface ChatRequest {
  id: number;
  requester?: {
    id: number;
    name: string;
    email: string;
  };
  target?: {
    id: number;
    name: string;
  };
  status: string;
  message?: string;
  created_at: string;
  room_id?: string;
}

export function ChatSidebar({ onSelectChat, onSelectRequest }: {
  onSelectChat?: (roomId: string) => void;
  onSelectRequest?: (request: ChatRequest) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    loadData();
  }, [user]);

  // Setup WebSocket notifications
  useUserNotifications({
    onChatRequest: (data) => {
      toast({
        title: 'New Chat Request',
        description: `${data.requester?.name || 'Someone'} wants to chat with you`,
      });
      loadData();
    },
    onAdminApproved: (data) => {
      toast({
        title: 'Request Approved',
        description: 'Your chat request has been approved by admin',
      });
      loadData();
    },
    onUserAccepted: (data) => {
      toast({
        title: 'Chat Started',
        description: 'You can now start chatting!',
      });
      loadData();
      if (data.room_id && onSelectChat) {
        onSelectChat(data.room_id);
      }
    },
    onChatRejected: (data) => {
      toast({
        title: 'Request Rejected',
        description: 'Your chat request was rejected',
        variant: 'destructive',
      });
      loadData();
    },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, roomsData] = await Promise.allSettled([
        chatApi.getMyChatRequests(),
        chatApi.getRooms(),
      ]);

      if (requestsData.status === 'fulfilled') {
        setRequests(requestsData.value || []);
      }

      if (roomsData.status === 'fulfilled') {
        setActiveChats(roomsData.value || []);
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const result = await chatApi.userAcceptRequest(requestId);
      toast({
        title: 'Chat Accepted',
        description: 'Chat room has been created',
      });
      loadData();
      if (result.room_id && onSelectChat) {
        onSelectChat(result.room_id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Could not accept request',
        variant: 'destructive',
      });
    }
  };

  // Filter requests
  const pendingRequests = requests.filter(
    (r) => r.status === 'admin_approved' && r.target?.id === user?.id
  );
  const myPendingRequests = requests.filter(
    (r) => r.status === 'pending' && r.requester?.id === user?.id
  );

  return (
    <Card className="h-full flex flex-col">
      <Tabs defaultValue="requests" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-2">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="chats" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chats ({activeChats.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {/* Pending requests for me */}
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Pending Your Approval</h3>
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="mb-2 border-2 border-orange-200">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold text-sm">
                              {request.requester?.name || 'Unknown'}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-[#E0F7F5] text-[#2BB6AF] text-xs">
                            Admin Approved
                          </Badge>
                        </div>
                        {request.message && (
                          <p className="text-xs text-gray-600 line-clamp-2">{request.message}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-[#2BB6AF] hover:bg-[#239a94]"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              // Handle reject
                            }}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* My pending requests */}
            {myPendingRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">My Requests</h3>
                {myPendingRequests.map((request) => (
                  <Card key={request.id} className="mb-2">
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            To: {request.target?.name || 'Unknown'}
                          </span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                            Pending Admin
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {format(new Date(request.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {pendingRequests.length === 0 && myPendingRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending requests</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chats" className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {activeChats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active chats</p>
              </div>
            ) : (
              activeChats.map((chat) => (
                <Card
                  key={chat.id || chat.room_id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    if (onSelectChat) {
                      onSelectChat(chat.room_id || chat.id);
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          {chat.other_participant?.name || 'Chat'}
                          {chat.other_participant?.is_staff || chat.other_participant?.is_superuser ? (
                            <span className="text-xs text-[#2BB6AF] ml-1">(admin)</span>
                          ) : chat.other_participant ? (
                            <span className="text-xs text-gray-500 ml-1">(user)</span>
                          ) : null}
                        </span>
                        {chat.unread_count > 0 && (
                          <Badge className="bg-[#2BB6AF] text-white text-xs">
                            {chat.unread_count}
                          </Badge>
                        )}
                      </div>
                      {chat.last_message && (
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {chat.last_message.content}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

