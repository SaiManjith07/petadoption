import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

interface ChatRequestNotification {
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
  message?: string;
  status: string;
  created_at: string;
}

interface UseUserNotificationsOptions {
  onChatRequest?: (data: ChatRequestNotification) => void;
  onAdminApproved?: (data: ChatRequestNotification) => void;
  onUserAccepted?: (data: { id: number; room_id: string; other_user: any }) => void;
  onChatRejected?: (data: ChatRequestNotification) => void;
  enabled?: boolean;
}

export function useUserNotifications({
  onChatRequest,
  onAdminApproved,
  onUserAccepted,
  onChatRejected,
  enabled = true,
}: UseUserNotificationsOptions) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const getWebSocketUrl = useCallback(() => {
    if (!user) return null;
    
    const token = localStorage.getItem('accessToken');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || '127.0.0.1:8000';
    
    return `${protocol}//${host}/ws/chat/user/${user.id}/?token=${token}`;
  }, [user]);

  const connect = useCallback(() => {
    if (!enabled || !user) return;

    const url = getWebSocketUrl();
    if (!url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'chat.request':
              if (onChatRequest && data.data) {
                onChatRequest(data.data);
              }
              break;
            case 'chat.admin_approved':
              if (onAdminApproved && data.data) {
                onAdminApproved(data.data);
              }
              break;
            case 'chat.user_accepted':
              if (onUserAccepted && data.data) {
                onUserAccepted(data.data);
              }
              break;
            case 'chat.rejected':
              if (onChatRejected && data.data) {
                onChatRejected(data.data);
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Notifications WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        
        // Reconnect after delay
        setTimeout(() => {
          if (enabled && user) {
            connect();
          }
        }, 3000);
      };
    } catch (error) {
      console.error('Error creating notifications WebSocket:', error);
      setIsConnected(false);
    }
  }, [user, enabled, getWebSocketUrl, onChatRequest, onAdminApproved, onUserAccepted, onChatRejected]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (enabled && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, enabled, connect, disconnect]);

  return {
    isConnected,
  };
}

