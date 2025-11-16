import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Clock, CheckCircle, XCircle, Heart, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { chatAPI, petsAPI } from '@/services/api';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chatsData, requestsData] = await Promise.all([
        chatAPI.getUserChats(user?.id || ''),
        chatAPI.getChatRequests(user?.id || ''),
      ]);
      setChats(chatsData);
      setRequests(requestsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load chats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const result = await chatAPI.respondToChatRequest(requestId, true);
      if (result) {
        toast({
          title: 'Chat approved',
          description: 'Chat room has been created. You can now communicate.',
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not approve chat request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await chatAPI.respondToChatRequest(requestId, false);
      toast({
        title: 'Chat request rejected',
        description: 'The request has been declined.',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not reject chat request',
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

  // Filter requests: show only pending requests where user is the owner (can approve)
  const pendingRequests = requests.filter(r => 
    r.status === 'pending' && r.isOwner
  );
  
  // Filter chats: only show active chats related to adoption or found pet claims
  const activeChats = chats.filter(c => 
    c.roomId && (c.type === 'adoption' || c.type === 'claim')
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Chats</h1>
          <p className="text-gray-600">Manage your conversations and chat requests</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Active Chats ({activeChats.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Requests ({pendingRequests.length})
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
                  <Card key={chat.roomId} className="hover:shadow-lg transition-shadow">
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
                          onClick={() => navigate(`/chat/${chat.roomId}`)}
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

          <TabsContent value="requests" className="mt-6">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600 text-center">
                    You don't have any pending chat requests.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((request) => (
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
                            Pet ID: {request.petId}
                          </p>
                          {request.message && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700">{request.message}</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mb-2">
                            Requested: {format(new Date(request.createdAt), 'MMM d, yyyy HH:mm')}
                          </p>
                          <p className="text-xs text-blue-600 font-medium">
                            From: {typeof request.requesterId === 'object' && request.requesterId?.name 
                              ? request.requesterId.name 
                              : 'User'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            onClick={() => handleApproveRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectRequest(request.id)}
                            variant="destructive"
                            size="sm"
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
        </Tabs>
      </div>
    </div>
  );
}


