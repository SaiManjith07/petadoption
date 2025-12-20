/**
 * Server-Sent Events (SSE) hook for real-time chat updates
 * SSE is simpler and more reliable than WebSockets for one-way real-time updates
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { chatApi } from '@/api';
import { API_BASE_URL } from '@/config/api';

interface Message {
  id: number;
  content: string;
  sender: number;
  sender_name?: string;
  created_at: string;
  read_status: boolean;
}

interface UseChatSSEOptions {
  roomId: string | number | null;
  enabled?: boolean;
  onMessageReceived?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export function useChatSSE({
  roomId,
  enabled = true,
  onMessageReceived,
  onError,
}: UseChatSSEOptions) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || !roomId || !user) {
      return;
    }

    // Don't reconnect if we've exceeded max attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn(`[SSE] Max reconnect attempts (${maxReconnectAttempts}) reached, giving up`);
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('[SSE] No access token found');
      return;
    }

    try {
      // Build SSE URL with token and last message ID
      // Note: EventSource doesn't support custom headers, so we pass token as query param
      const baseUrl = API_BASE_URL;
      const encodedToken = encodeURIComponent(token);
      const url = `${baseUrl}/api/chats/rooms/${roomId}/stream/?token=${encodedToken}&last_id=${lastMessageId || 0}`;
      
      // Create EventSource (SSE connection)
      // Note: EventSource uses GET requests and doesn't support custom headers
      // We pass the token as a query parameter
      const eventSource = new EventSource(url, {
        withCredentials: true,
      });
      
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              break;
              
            case 'message':
              if (data.data && onMessageReceived) {
                onMessageReceived(data.data);
                // Update last message ID
                if (data.data.id) {
                  setLastMessageId(data.data.id);
                }
              }
              break;
              
            case 'heartbeat':
              // Just acknowledge heartbeat, no action needed
              break;
              
            case 'error':
              console.error('[SSE] Server error:', data.message);
              if (onError) {
                onError(new Error(data.message));
              }
              break;
              
            default:
              break;
          }
        } catch (error) {
          console.error('[SSE] Error parsing message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        setIsConnected(false);
        
        // Close the connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        } else {
          console.warn('[SSE] Max reconnect attempts reached');
        }
      };
    } catch (error) {
      console.error('[SSE] Error creating EventSource:', error);
      setIsConnected(false);
    }
  }, [roomId, user, enabled, lastMessageId, onMessageReceived, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    // SSE is one-way (server to client), so we use REST API to send messages
    if (!roomId) {
      console.error('[SSE] Cannot send message: no roomId');
      return false;
    }

    try {
      await chatApi.sendMessage(roomId, content.trim());
      return true;
    } catch (error) {
      console.error('[SSE] Error sending message via REST API:', error);
      if (onError) {
        onError(error as Error);
      }
      return false;
    }
  }, [roomId, onError]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled && roomId && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, roomId, user, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    disconnect,
    connect,
  };
}

