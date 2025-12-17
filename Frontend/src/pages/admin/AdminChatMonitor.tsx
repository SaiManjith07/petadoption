import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Shield,
  User,
  MessageSquare,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/api';
import { chatApi } from '@/api/chatApi';
import { useChatSSE } from '@/hooks/useChatSSE';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopNav } from '@/components/layout/AdminTopNav';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  timestamp?: string;
  read_status: boolean;
}

interface ChatRoom {
  id: number;
  room_id?: string;
  type?: string;
  participants?: any[];
  pet?: any;
  created_at?: string;
}

export default function AdminChatMonitor() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [sseError, setSseError] = useState<string | null>(null);
  const [sseEnabled, setSseEnabled] = useState(true);
  const [actualRoomId, setActualRoomId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // SSE connection for real-time monitoring - use actual room ID from loaded room data
  const { isConnected } = useChatSSE({
    roomId: actualRoomId || roomId || null,
    enabled: sseEnabled && !!(actualRoomId || roomId),
    onMessageReceived: (message: any) => {
      // Convert message format if needed
      const formattedMessage: Message = {
        id: message.id,
        content: message.content,
        sender: message.sender || {
          id: message.sender_id || message.sender?.id,
          name: message.sender_name || message.sender?.name || 'Unknown',
          email: message.sender?.email || '',
        },
        created_at: message.created_at || message.timestamp,
        timestamp: message.created_at || message.timestamp,
        read_status: message.read_status || false,
      };
      
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === formattedMessage.id)) {
          return prev;
        }
        return [...prev, formattedMessage];
      });
      // Clear any previous SSE errors on successful message
      setSseError(null);
    },
    onError: (error: Error) => {
      console.error('[SSE] Error in chat monitor:', error);
      const errorMsg = error.message || 'Failed to connect to real-time updates';
      setSseError(errorMsg);
      
      // If it's a 500 error or connection failed, disable SSE after a few attempts
      if (errorMsg.includes('500') || errorMsg.includes('ERR_FAILED')) {
        console.warn('[SSE] Backend error detected, disabling SSE connection');
        setSseEnabled(false);
      }
      // Don't show toast for SSE errors as they're expected during connection issues
    },
  });

  useEffect(() => {
    if (roomId) {
      loadChatRoom();
    }
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatRoom = async () => {
    try {
      setLoading(true);
      
      // Load room details - try multiple approaches
      let roomData: any = null;
      let room: any = {};
      
      try {
        roomData = await adminApi.getChatRoom(roomId!);
        room = roomData?.data || roomData || {};
      } catch (error: any) {
        // If admin API fails, try using chatApi directly
        if (error?.response?.status === 404) {
          try {
            // Try with chatApi - it might work for admins too
            const { chatApi } = await import('@/api/chatApi');
            // Try parsing as number first, then use as string
            const numericId = parseInt(roomId as string);
            if (!isNaN(numericId)) {
              roomData = await chatApi.getRoom(numericId);
              room = roomData || {};
            } else {
              // If it's a string ID like "3_6", create minimal room object
              room = {
                room_id: roomId,
                roomId: roomId,
                id: roomId,
              };
            }
          } catch (chatError: any) {
            // If all else fails, create a minimal room object from the URL roomId
            room = {
              room_id: roomId,
              roomId: roomId,
              id: roomId,
            };
          }
        } else {
          throw error;
        }
      }
      
      setRoom(room);
      
      // Extract participants - try multiple formats
      let extractedParticipants: any[] = [];
      if (room.participants && Array.isArray(room.participants)) {
        extractedParticipants = room.participants;
      } else if (room.user_a && room.user_b) {
        extractedParticipants = [room.user_a, room.user_b];
      } else if (room.users && Array.isArray(room.users)) {
        extractedParticipants = room.users;
      } else if (room.participant_ids && Array.isArray(room.participant_ids)) {
        // If we only have IDs, try to fetch user details
        try {
          const { adminApi } = await import('@/api/adminApi');
          const allUsers = await adminApi.getUsers();
          extractedParticipants = room.participant_ids.map((id: any) => {
            const user = allUsers.find((u: any) => u.id === id || u._id === id);
            return user || { id, name: `User ${id}`, email: '' };
          });
        } catch (error: any) {
          extractedParticipants = room.participant_ids.map((id: any) => ({ id, name: `User ${id}`, email: '' }));
        }
      }
      
      // If no participants found and room ID is in format "3_6", try to parse it
      if (extractedParticipants.length === 0 && roomId && typeof roomId === 'string' && roomId.includes('_')) {
        const userIds = roomId.split('_').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (userIds.length >= 2) {
          // Try to fetch user details for these IDs
          try {
            const { adminApi } = await import('@/api/adminApi');
            const allUsers = await adminApi.getUsers();
            extractedParticipants = userIds.map(userId => {
              const user = allUsers.find((u: any) => u.id === userId || u._id === userId);
              return user || { id: userId, name: `User ${userId}`, email: '' };
            });
          } catch (error: any) {
            // If fetching fails, create minimal participant objects
            extractedParticipants = userIds.map(userId => ({ id: userId, name: `User ${userId}`, email: '' }));
          }
        }
      }
      
      // Ensure all participants have IDs - extract from room ID if missing
      if (extractedParticipants.length > 0) {
        extractedParticipants = extractedParticipants.map((p, index) => {
          if (!p.id && !p._id && roomId && typeof roomId === 'string' && roomId.includes('_')) {
            const userIds = roomId.split('_').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            if (userIds[index]) {
              return { ...p, id: userIds[index] };
            }
          }
          return p;
        });
      }
      
      setParticipants(extractedParticipants);
      
      // Determine the actual room ID for SSE and messages
      // Priority: room_id (string like "3_6") > roomId > id > roomId from URL
      const actualRoomIdForMessages = room?.room_id || room?.roomId || room?.id?.toString() || roomId;
      
      // Set the actual room ID for SSE connection
      setActualRoomId(actualRoomIdForMessages?.toString() || null);
      
      // Load existing messages - try multiple approaches
      if (actualRoomIdForMessages) {
        try {
          // Try getRoomMessages which accepts string IDs
          const { chatApi } = await import('@/api/chatApi');
          const messagesData = await chatApi.getRoomMessages(actualRoomIdForMessages.toString());
          // Handle different message response formats
          const messages = Array.isArray(messagesData) 
            ? messagesData 
            : messagesData?.data || messagesData?.messages || [];
          setMessages(messages);
        } catch (error: any) {
          // If getRoomMessages fails, try getMessages
          try {
            const { chatApi } = await import('@/api/chatApi');
            const messagesData = await chatApi.getMessages(actualRoomIdForMessages.toString());
            const messages = Array.isArray(messagesData) 
              ? messagesData 
              : messagesData?.data || messagesData?.messages || [];
            setMessages(messages);
          } catch (msgError: any) {
            // If both fail, just set empty array - messages might load via SSE or user can refresh
            setMessages([]);
          }
        }
      } else {
        setMessages([]);
      }
      
    } catch (error: any) {
      // Show warning but don't prevent the page from loading
      toast({
        title: 'Warning',
        description: error?.response?.data?.detail || error?.response?.data?.error || error?.message || 'Some chat data could not be loaded. You can still monitor the chat.',
        variant: 'default',
      });
      // Set minimal room info so the page can still render
      setRoom({
        room_id: roomId,
        roomId: roomId,
        id: roomId,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadChatRoom();
    toast({
      title: 'Refreshed',
      description: 'Chat data has been refreshed',
    });
  };

  const handleTerminateChat = async () => {
    if (!roomId) return;
    
    try {
      setIsTerminating(true);
      await adminApi.closeChat(roomId);
      toast({
        title: 'Success',
        description: 'Chat has been terminated successfully',
      });
      navigate('/admin/chats');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to terminate chat',
        variant: 'destructive',
      });
    } finally {
      setIsTerminating(false);
      setTerminateDialogOpen(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!roomId) return;
    
    try {
      setIsDeleting(true);
      await adminApi.deleteChat(roomId);
      toast({
        title: 'Success',
        description: 'Chat room deleted successfully',
      });
      navigate('/admin/chats');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete chat room',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
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
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2BB6AF] border-t-transparent mx-auto" />
              <p className="mt-4 text-gray-600">Loading chat monitor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        />
        
        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/admin/chats')}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-[#2BB6AF]" />
                    <h1 className="text-3xl font-bold text-gray-900">Chat Monitor</h1>
                    <Badge variant="outline" className="gap-2 border-[#2BB6AF]/30">
                      {isConnected || messages.length > 0 ? (
                        <>
                          <Wifi className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">
                            {isConnected ? 'Live' : 'Messages Loaded'}
                          </span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500">Connecting...</span>
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mt-1">
                    {participants.length > 0 ? (
                      <>
                        Chat between: <span className="font-semibold text-[#2BB6AF]">
                          {participants.map(p => {
                            const userId = p.id || p._id || '';
                            const userName = p.name || p.email || 'Unknown User';
                            return userId ? `${userId} - ${userName}` : userName;
                          }).join(' & ')}
                        </span>
                      </>
                    ) : (
                      <>
                        Monitoring chat room: <span className="font-mono text-[#2BB6AF]">{roomId}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setTerminateDialogOpen(true)} 
                  className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <XCircle className="h-4 w-4" />
                  Terminate Chat
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)} 
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Room
                </Button>
              </div>
            </div>

            {/* Chat Room Content */}
            <div className="grid gap-6 lg:grid-cols-4">
              {/* Chat Messages Area */}
              <div className="lg:col-span-3">
                <Card className="flex h-[calc(100vh-12rem)] flex-col">
                  <CardHeader className="border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Conversation
                        </CardTitle>
                        <CardDescription>
                          {messages.length} message{messages.length !== 1 ? 's' : ''} • 
                          {room?.type && (
                            <Badge variant={room.type === 'adoption' ? 'default' : 'secondary'} className="ml-2">
                              {room.type.toUpperCase()}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Admin View Only
                        </Badge>
                        {sseError && (
                          <Badge variant="outline" className="gap-1 border-yellow-300 bg-yellow-50 text-yellow-700">
                            <AlertCircle className="h-3 w-3" />
                            Connection Issue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {sseError && (
                    <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-yellow-800">
                          ⚠️ Real-time updates unavailable. Messages are loaded from the server. Click "Refresh" to see new messages.
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSseError(null);
                            setSseEnabled(true);
                            handleRefresh();
                          }}
                          className="h-6 text-xs text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100"
                        >
                          Retry Connection
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-gray-500">No messages yet</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Messages will appear here when participants start chatting
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message, index) => {
                          const sender = participants.find(p => p.id === message.sender.id) || message.sender;
                          const prevMessage = index > 0 ? messages[index - 1] : null;
                          const isSameSender = prevMessage && prevMessage.sender.id === message.sender.id;
                          const showSenderInfo = !isSameSender;
                          
                          return (
                            <div
                              key={message.id}
                              className={`flex gap-3 ${showSenderInfo ? 'mt-4' : 'mt-1'}`}
                            >
                              {showSenderInfo ? (
                                <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-[#2BB6AF]/20">
                                  <AvatarFallback className="bg-gradient-to-br from-[#2BB6AF] to-[#239a94] text-white font-semibold">
                                    {sender.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-10 flex-shrink-0" />
                              )}
                              <div className="flex flex-col flex-1 min-w-0">
                                {showSenderInfo && (
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-sm font-semibold text-gray-900">{sender.name || 'Unknown User'}</span>
                                    <span className="text-xs text-gray-500">
                                      {format(new Date(message.timestamp || message.created_at || Date.now()), 'MMM dd, HH:mm')}
                                    </span>
                                    {sender.email && (
                                      <span className="text-xs text-gray-400 truncate">({sender.email})</span>
                                    )}
                                  </div>
                                )}
                                {!showSenderInfo && (
                                  <span className="text-xs text-gray-400 mb-1 ml-1">
                                    {format(new Date(message.timestamp || message.created_at || Date.now()), 'HH:mm')}
                                  </span>
                                )}
                                <div className="rounded-lg px-4 py-2.5 max-w-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                  <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                                    {message.content || message.text || message.message || 'No content'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Room Info */}
              <div className="lg:col-span-1 space-y-4">
                {/* Room Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Room Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {participants.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Chat Between</p>
                        <p className="text-sm font-semibold text-[#2BB6AF]">
                          {participants.map(p => {
                            const userId = p.id || p._id || '';
                            const userName = p.name || p.email || 'Unknown User';
                            return userId ? `${userId} - ${userName}` : userName;
                          }).join(' & ')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-600">Room ID</p>
                      <p className="text-sm font-mono text-gray-500">{room?.room_id || room?.roomId || room?.id || roomId || 'N/A'}</p>
                    </div>
                    {(room?.type || room?.chat_type) && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Type</p>
                        <Badge variant={(room?.type || room?.chat_type) === 'adoption' ? 'default' : 'secondary'}>
                          {(room?.type || room?.chat_type || 'N/A').toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    {(room?.pet || room?.pet_id) && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pet</p>
                        <p className="text-sm text-gray-900">
                          {room?.pet?.name || room?.pet?.id || room?.pet_id || 'N/A'}
                        </p>
                        {room?.pet?.name && room?.pet?.id && (
                          <p className="text-xs text-gray-500 font-mono">ID: {room.pet.id}</p>
                        )}
                      </div>
                    )}
                    {(room?.created_at || room?.createdAt) && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Created</p>
                        <p className="text-sm text-gray-900">
                          {format(new Date(room.created_at || room.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    )}
                    {room?.status && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Status</p>
                        <Badge variant={room.status === 'active' ? 'default' : 'secondary'}>
                          {room.status}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Participants */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Participants ({participants.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {participants.length === 0 ? (
                      <p className="text-sm text-gray-500">No participants found</p>
                    ) : (
                      participants.map((participant, idx) => (
                        <div key={participant.id || idx} className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {participant.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {participant.name || 'Unknown User'}
                            </p>
                            {participant.email && (
                              <p className="text-xs text-gray-500 truncate">{participant.email}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Monitoring Info */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                      <AlertCircle className="h-5 w-5" />
                      Monitoring Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-blue-800">
                      You are viewing this chat in <strong>read-only</strong> mode. 
                      You cannot send messages or interact with participants.
                    </p>
                    <Separator className="bg-blue-200" />
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      {isConnected ? (
                        <>
                          <Wifi className="h-4 w-4 text-green-500" />
                          <span>Real-time updates active</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4 text-gray-400" />
                          <span>Connection offline</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Terminate Chat Dialog */}
      <AlertDialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate this chat? This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Close the chat room and prevent further messages</li>
                <li>Notify participants that the chat has been terminated</li>
                <li>Chat history will be preserved but no new messages can be sent</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTerminating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminateChat}
              disabled={isTerminating}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isTerminating ? 'Terminating...' : 'Terminate Chat'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Chat Room Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this chat room? This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Delete all messages in this chat room</li>
                <li>Remove the chat room from the system</li>
                <li>This action cannot be undone</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

