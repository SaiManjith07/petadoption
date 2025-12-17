import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

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

interface UseChatSocketOptions {
  roomId: string | null;
  onMessageReceived?: (message: Message) => void;
  onTyping?: (userId: number, userName: string, isTyping: boolean) => void;
  onPresence?: (userId: number, userName: string, status: 'online' | 'offline') => void;
  enabled?: boolean;
}

export function useChatSocket({
  roomId,
  onMessageReceived,
  onTyping,
  onPresence,
  enabled = true,
}: UseChatSocketOptions) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;

  const getWebSocketUrl = useCallback(() => {
    if (!roomId || !user) return null;
    
    const token = localStorage.getItem('accessToken');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || '127.0.0.1:8000';
    
    return `${protocol}//${host}/ws/chat/${roomId}/?token=${token}`;
  }, [roomId, user]);

  const connect = useCallback(() => {
    if (!enabled || !roomId || !user) return;

    const url = getWebSocketUrl();
    if (!url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'message':
              if (onMessageReceived && data.data) {
                onMessageReceived(data.data);
              }
              break;
            case 'typing':
              if (onTyping && data.user_id) {
                onTyping(data.user_id, data.user_name || 'User', data.typing);
              }
              break;
            case 'presence':
              if (onPresence && data.user_id) {
                onPresence(data.user_id, data.user_name || 'User', data.status);
              }
              break;
            case 'error':
              console.error('WebSocket error:', data.message);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnected(false);
    }
  }, [roomId, user, enabled, getWebSocketUrl, reconnectAttempts, onMessageReceived, onTyping, onPresence]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    // Try WebSocket first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'message',
          content: content.trim(),
        }));
        return true;
      } catch (error) {
        console.warn('WebSocket send failed, falling back to REST API:', error);
      }
    }
    
    // Fallback to REST API if WebSocket is not available
    if (roomId) {
      try {
        const { chatApi } = await import('@/api');
        await chatApi.sendMessage(roomId, content.trim());
        return true;
      } catch (error) {
        console.error('REST API send failed:', error);
        return false;
      }
    }
    
    return false;
  }, [roomId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        typing: isTyping,
      }));
    }
  }, []);

  const markAsRead = useCallback((messageId: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'read',
        message_id: messageId,
      }));
    }
  }, []);

  useEffect(() => {
    if (enabled && roomId && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [roomId, enabled, user, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    sendTyping,
    markAsRead,
    reconnect: connect,
  };
}

