import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Shield,
  User,
  MessageSquare,
  Eye,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/api';
import { getBaseUrl } from '@/config/api';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopNav } from '@/components/layout/AdminTopNav';

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    name: string;
    email: string;
    is_staff?: boolean;
  };
  created_at: string;
  message_type?: string;
  image?: string;
  image_url?: string;
  is_deleted?: boolean;
}

interface ChatRoom {
  id: number;
  room_id?: string;
  type?: string;
  participants?: any[];
  pet?: any;
  created_at?: string;
}

export default function AdminChatReadOnly() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [chatRequest, setChatRequest] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId) {
      loadChatData();
    }
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatData = async () => {
    if (!roomId) return;
    
    try {
      setLoading(true);
      const data = await adminApi.viewChatReadOnly(roomId);
      
      setRoom(data.room);
      setMessages(data.messages || []);
      setParticipants(data.participants || []);
      setIsReadOnly(data.is_readonly !== false);
      setIsVerifyingAdmin(data.is_verifying_admin || false);
      setChatRequest(data.chat_request);
    } catch (error: any) {
      console.error('Error loading chat data:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.error || error?.message || 'Failed to load chat',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image: string | undefined, imageUrl: string | undefined): string | null => {
    if (imageUrl) return imageUrl;
    if (image) {
      if (image.startsWith('http')) return image;
      return `${getBaseUrl()}${image}`;
    }
    return null;
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
          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading chat...</p>
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
        
        <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="border-b bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/admin/chats')}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                      Read-Only Chat View
                      <Badge variant="outline" className="ml-2">
                        Monitoring
                      </Badge>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isVerifyingAdmin 
                        ? 'You are the verifying admin (can send messages)' 
                        : 'You are viewing this chat in read-only mode'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isReadOnly ? 'secondary' : 'default'}>
                    {isReadOnly ? 'Read-Only' : 'Full Access'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadChatData}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender.id === (chatRequest?.verified_by_admin?.id || null);
                  const imageUrl = getImageUrl(message.image, message.image_url);
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {message.sender.name?.charAt(0) || message.sender.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                          {!isOwn && (
                            <p className="text-xs font-semibold mb-1 opacity-80">
                              {message.sender.name} {message.sender.is_staff ? '(Admin)' : ''}
                            </p>
                          )}
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.is_deleted ? (
                              <p className="italic text-muted-foreground">Message deleted</p>
                            ) : message.message_type === 'image' && imageUrl ? (
                              <img
                                src={imageUrl}
                                alt="Shared image"
                                className="max-w-full h-auto rounded"
                                style={{ maxHeight: '300px' }}
                              />
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(message.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Read-Only Notice */}
            {isReadOnly && (
              <div className="border-t bg-yellow-50 border-yellow-200 px-6 py-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Eye className="h-4 w-4" />
                  <p className="text-sm">
                    You are viewing this chat in read-only mode. Only the verifying admin can send messages.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Participants Sidebar */}
          <div className="w-80 border-l bg-white overflow-hidden flex flex-col shadow-sm">
            <div className="p-6 border-b bg-white flex-shrink-0">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Participants ({participants.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <div className="space-y-3">
                {participants.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={p.is_staff ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}>
                        {p.name?.charAt(0) || p.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {p.name || p.email} {p.is_staff ? '(Admin)' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.is_verifying_admin ? 'Verifying Admin' : p.is_staff ? 'Admin' : 'User'}
                      </p>
                    </div>
                    {p.is_verifying_admin && (
                      <Badge variant="destructive" className="text-xs">Verifier</Badge>
                    )}
                  </div>
                ))}
              </div>

              {chatRequest && (
                <>
                  <Separator className="my-6" />
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Chat Request Info
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline">
                          {chatRequest.type || 'general'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline">
                          {chatRequest.status}
                        </Badge>
                      </div>
                      {chatRequest.pet && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Pet ID:</span>
                          <span className="font-medium">{chatRequest.pet.id || chatRequest.pet_id}</span>
                        </div>
                      )}
                      {chatRequest.verified_by_admin && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Verified by:</span>
                          <span className="font-medium text-sm">
                            {chatRequest.verified_by_admin.name || chatRequest.verified_by_admin.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

