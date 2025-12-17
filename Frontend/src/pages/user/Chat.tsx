import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, User, Shield, CheckCircle, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { chatApi } from '@/api/chatApi';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useChatSSE } from '@/hooks/useChatSSE';
import { format } from 'date-fns';

interface Message {
  id: number;
  sender: {
    id: number;
    name: string;
    email: string;
  };
  content: string;
  timestamp: string;
  created_at?: string;
  read_status: boolean;
}

interface ChatRoom {
  id: number;
  room_id?: string;
  participants?: any[];
  other_participant?: any;
}

export default function Chat() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Server-Sent Events (SSE) connection - simpler and more reliable than WebSocket
  const { isConnected, sendMessage: sendSSEMessage } = useChatSSE({
    roomId: roomId || null,
    onMessageReceived: (message: any) => {
      // Convert message format if needed
      const formattedMessage: Message = {
        id: message.id,
        sender: message.sender || {
          id: message.sender_id || message.sender?.id,
          name: message.sender_name || message.sender?.name || 'Unknown',
          email: message.sender?.email || '',
        },
        content: message.content,
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
    },
    enabled: !!roomId && !!user,
  });

  useEffect(() => {
    if (roomId) {
      loadRoom();
    }
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      // Try to get room by room_id first (string)
      let roomData;
      try {
        const rooms = await chatApi.getRooms();
        roomData = rooms.find((r: any) => r.room_id === roomId || r.roomId === roomId || r.id?.toString() === roomId);
      } catch (e) {
        // Fallback to numeric ID
        try {
          roomData = await chatApi.getRoom(parseInt(roomId!));
        } catch (e2) {
          throw new Error('Room not found');
        }
      }
      
      if (!roomData) {
        throw new Error('Room not found');
      }
      
      setRoom(roomData);
      
      // Get other participant
      if (roomData.other_participant) {
        setOtherUser(roomData.other_participant);
      } else if (roomData.participants && roomData.participants.length > 0) {
        const other = roomData.participants.find((p: any) => p.id !== user?.id);
        if (other) setOtherUser(other);
      }
      
      // Load messages
      const actualRoomId = roomData.room_id || roomData.roomId || roomData.id;
      const messagesData = await chatApi.getRoomMessages(actualRoomId.toString());
      setMessages(messagesData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Could not load chat room',
        variant: 'destructive',
      });
      navigate('/chats');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !roomId) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Send via SSE hook (which uses REST API internally)
    const actualRoomId = room?.room_id || room?.roomId || room?.id || roomId;
    const success = await sendSSEMessage(messageContent);
    
    if (!success) {
      // Fallback to direct REST API call
      try {
        const message = await chatApi.sendMessage(actualRoomId.toString(), messageContent);
        setMessages(prev => [...prev, message]);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not send message',
          variant: 'destructive',
        });
        setNewMessage(messageContent); // Restore message on error
      }
    }
    // If success, message will be added via SSE callback
  };

  const handleMarkReunified = () => {
    toast({
      title: 'Pet marked as reunified!',
      description: 'Both parties will be notified. Great work!',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="flex h-[calc(100vh-12rem)] flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/chats')}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  <div>
                      <CardTitle className="flex items-center gap-2">
                        {otherUser?.name || 'Chat'}
                        {isOnline ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-gray-400" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {isConnected ? 'Connected' : 'Connecting...'} • Room: {roomId}
                      </CardDescription>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button onClick={handleMarkReunified} className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Mark Reunified
                    </Button>
                  )}
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender.id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={isOwn ? 'bg-primary text-primary-foreground' : ''}>
                          {message.sender.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col ${isOwn ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{message.sender.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.timestamp || message.created_at || Date.now()), 'HH:mm')}
                          </span>
                        </div>
                        <div
                          className={`rounded-lg px-4 py-2 max-w-md ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content || message.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typingUsers.size > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                    <span>{Array.from(typingUsers).map(id => {
                      const user = room?.participants?.find((p: any) => p.id === id);
                      return user?.name || 'Someone';
                    }).join(', ')}</span>
                    <span>is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Press Enter to send • Attach files with the paperclip
                </p>
              </div>
            </Card>
          </div>

          {/* Participants Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Participants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Pet Owner</p>
                      <p className="text-xs text-muted-foreground truncate">Lost their pet</p>
                    </div>
                    <Badge variant="secondary">Owner</Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-secondary/10 text-secondary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Rescuer</p>
                      <p className="text-xs text-muted-foreground truncate">Found the pet</p>
                    </div>
                    <Badge variant="secondary">Rescuer</Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-accent/10 text-accent">
                        <Shield className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Admin</p>
                      <p className="text-xs text-muted-foreground truncate">Moderator</p>
                    </div>
                    <Badge variant="secondary">Admin</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Chat Guidelines</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Be respectful and patient</li>
                    <li>• Share clear photos for verification</li>
                    <li>• Arrange safe meetup locations</li>
                    <li>• Admin will assist if needed</li>
                  </ul>
                </div>

                {isAdmin && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-warning">Admin Actions</h4>
                      <Button variant="outline" size="sm" className="w-full">
                        Request Proof
                      </Button>
                      <Button size="sm" className="w-full">
                        Mark Reunified
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
