import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChatSocket } from '@/hooks/useChatSocket';
import { chatApi } from '@/api';
import { useAuth } from '@/lib/auth';
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
  read_status: boolean;
}

interface ChatWindowProps {
  roomId: string;
  otherUser?: {
    id: number;
    name: string;
    email?: string;
  };
  isOnline?: boolean;
}

export function ChatWindow({ roomId, otherUser, isOnline = false }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial messages
  useEffect(() => {
    if (roomId) {
      loadMessages();
    }
  }, [roomId]);

  // WebSocket connection
  const { isConnected, sendMessage, sendTyping } = useChatSocket({
    roomId,
    onMessageReceived: (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    },
    onTyping: (userId, userName, isTyping) => {
      if (userId !== user?.id) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      }
    },
    onPresence: (userId, userName, status) => {
      // Handle presence updates if needed
    },
    enabled: !!roomId,
  });

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getRoomMessages(roomId);
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    const content = inputMessage.trim();
    if (!content || !isConnected) return;

    if (sendMessage(content)) {
      setInputMessage('');
      sendTyping(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInputMessage(value);

    // Send typing indicator
    if (value.trim() && isConnected) {
      sendTyping(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 3000);
    } else {
      sendTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg">{otherUser?.name || 'Chat'}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-xs text-gray-500">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          {!isConnected && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              Connecting...
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwn = message.sender.id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-3 shadow-md ${
                      isOwn
                        ? 'bg-[#2BB6AF] text-white ml-auto'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-semibold mb-1 opacity-80">
                        {message.sender.name}
                        {message.sender.is_staff || message.sender.is_superuser ? (
                          <span className="text-blue-600 ml-1">(admin)</span>
                        ) : (
                          <span className="text-gray-500 ml-1">(user)</span>
                        )}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-green-100' : 'text-gray-500'
                      }`}
                    >
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
            {typingUsers.size > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" />
                    <div
                      className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={2}
            className="resize-none"
            disabled={!isConnected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected}
            className="bg-[#2BB6AF] hover:bg-[#239a94]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

