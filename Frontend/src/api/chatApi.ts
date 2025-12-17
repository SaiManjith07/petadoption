import apiClient from './apiClient';
import { ChatRoom, Message } from '@/models';

export const chatApi = {
  /**
   * Get all chat rooms for current user
   */
  async getRooms(): Promise<ChatRoom[]> {
    try {
      const response = await apiClient.get<any>('/chats/rooms/');
      // Handle both array response and object with data property
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        // Paginated response
        return response.data.results;
      } else {
        // Return empty array if response format is unexpected
        console.warn('Unexpected response format from /chats/rooms/', response.data);
        return [];
      }
    } catch (error: any) {
      // If endpoint doesn't exist or returns 400, return empty array
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.warn('Chat rooms endpoint not available, returning empty array');
        return [];
      }
      console.error('Error fetching chat rooms:', error);
      return [];
    }
  },

  /**
   * Get chat room by ID
   */
  async getRoom(roomId: number): Promise<ChatRoom> {
    const response = await apiClient.get<ChatRoom>(`/chats/rooms/${roomId}/`);
    return response.data;
  },

  /**
   * Get or create chat room with another user
   */
  async getOrCreateRoom(userId: number): Promise<ChatRoom> {
    try {
      // Try to get existing room first
      const response = await apiClient.get<ChatRoom>(`/chats/rooms/user/${userId}/`);
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist (404) or server error (500), try alternative approaches
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.warn(`Failed to get room for user ${userId}, trying alternatives...`);
        
        // First, try getting all rooms and finding an existing one
        try {
          const rooms = await this.getRooms();
          // Look for a room that includes this user
          const existingRoom = rooms.find((room: any) => {
            const participants = room.participants || room.participant_ids || room.users || [];
            return participants.some((p: any) => {
              const pId = p.id || p.user_id || p.user?.id || p;
              return String(pId) === String(userId);
            });
          });
          if (existingRoom) {
            console.log('Found existing room:', existingRoom);
            return existingRoom;
          }
        } catch (roomsError: any) {
          console.warn('Error fetching rooms to find existing:', roomsError);
        }
        
        // If no existing room found, try creating a new one
        try {
          // Try different payload formats
          const payloads = [
            { participant_ids: [userId] },
            { user_id: userId },
            { participants: [userId] },
            { target_user_id: userId },
          ];
          
          for (const payload of payloads) {
            try {
              const createResponse = await apiClient.post<ChatRoom>('/chats/rooms/', payload);
              if (createResponse.data) {
                console.log('Created room with payload:', payload);
                return createResponse.data;
              }
            } catch (payloadError: any) {
              // Try next payload format
              continue;
            }
          }
        } catch (createError: any) {
          console.error('Error creating chat room with all formats:', createError);
        }
        
        // If all attempts failed, throw a more descriptive error
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.error || 
                            error.message || 
                            'Unable to get or create chat room. The chat system may be temporarily unavailable.';
        const newError = new Error(errorMessage);
        (newError as any).response = error.response;
        throw newError;
      }
      // For other errors, throw them
      throw error;
    }
  },

  /**
   * Create a new chat room
   */
  async createRoom(participantIds: number[]): Promise<ChatRoom> {
    try {
      // Try different payload formats
      const payloads = [
        { participant_ids: participantIds },
        { participants: participantIds },
        { user_ids: participantIds },
      ];
      
      for (const payload of payloads) {
        try {
          const response = await apiClient.post<ChatRoom>('/chats/rooms/', payload);
          if (response.data) {
            return response.data;
          }
        } catch (payloadError: any) {
          // If this payload format fails, try the next one
          if (payloads.indexOf(payload) < payloads.length - 1) {
            continue;
          }
          // If all formats failed, throw the last error
          throw payloadError;
        }
      }
      
      throw new Error('Failed to create room with any payload format');
    } catch (error: any) {
      console.error('Error creating chat room:', error);
      // Re-throw with better error message
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to create chat room';
      const newError = new Error(errorMessage);
      (newError as any).response = error.response;
      throw newError;
    }
  },

  /**
   * Get messages in a chat room
   */
  async getMessages(roomId: number | string): Promise<Message[]> {
    try {
      // Try string room_id first (like "3_6")
      if (typeof roomId === 'string') {
        const response = await apiClient.get(`/chats/rooms/${roomId}/messages/`);
        return response.data?.data || response.data || [];
      } else {
        // Try integer ID
        const response = await apiClient.get<Message[]>(`/chats/rooms/${roomId}/messages/`);
        return response.data?.data || response.data || [];
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  /**
   * Send a message (supports both integer ID and string room_id)
   */
  async sendMessage(roomId: number | string, content: string): Promise<Message> {
    // If roomId is a string (like "3_6"), use the string endpoint
    // If it's a number, use the integer endpoint
    const endpoint = typeof roomId === 'string' 
      ? `/chats/rooms/${roomId}/send/`
      : `/chats/rooms/${roomId}/send/`;
    
    try {
      const response = await apiClient.post<Message>(endpoint, {
        content,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Mark messages as read
   */
  async markAsRead(roomId: number): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/chats/rooms/${roomId}/read/`);
    return response.data;
  },

  /**
   * Request chat with pet owner/finder
   */
  async requestChat(petId: number | string, requesterId: number | string, type: 'claim' | 'adoption', message?: string): Promise<any> {
    // Validate inputs
    if (!petId) {
      throw new Error('Pet ID is required');
    }
    if (!requesterId) {
      throw new Error('Requester ID is required');
    }
    
    try {
      const response = await apiClient.post('/chats/request/', {
        pet_id: petId,
        requester_id: requesterId,
        type,
        message: message || '',
      });
      return response.data;
    } catch (error: any) {
      console.error('Chat API Error:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      console.error('Error response status:', error?.response?.status);
      
      // Extract error message from response
      let errorMessage = 'Failed to create chat request';
      
      if (error?.response?.data) {
        // Response has data
        errorMessage = error.response.data.detail || 
                      error.response.data.error || 
                      JSON.stringify(error.response.data);
      } else if (error?.response) {
        // Response exists but no data
        errorMessage = `Server error: ${error.response.status} ${error.response.statusText}`;
      } else if (error?.message) {
        // Network or other error
        errorMessage = error.message;
      }
      
      // Create error with more details
      const detailedError = new Error(errorMessage);
      (detailedError as any).response = error?.response;
      (detailedError as any).responseData = error?.response?.data;
      throw detailedError;
    }
  },

  /**
   * Get chat requests for current user
   */
  async getChatRequests(): Promise<any[]> {
    const response = await apiClient.get('/chats/requests/');
    return response.data.data || response.data || [];
  },

  /**
   * Respond to a chat request (approve/reject)
   */
  async respondToChatRequest(requestId: number | string, approved: boolean): Promise<any> {
    const response = await apiClient.post(`/chats/requests/${requestId}/respond/`, {
      approved,
    });
    return response.data;
  },

  /**
   * Get chat requests for the current user (as owner/finder)
   */
  async getChatRequestsForOwner(): Promise<any[]> {
    try {
      const response = await apiClient.get('/chats/requests/owner');
      const data = response.data;
      // Handle both array response and object with data property
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.data)) {
        return data.data;
      } else {
        console.warn('Unexpected response format from /chats/requests/owner', data);
        return [];
      }
    } catch (error: any) {
      // If endpoint doesn't exist, return empty array
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.warn('Chat requests for owner endpoint not available, returning empty array');
        return [];
      }
      console.error('Error fetching chat requests for owner:', error);
      return [];
    }
  },

  /**
   * Owner/Finder responds to a chat request (after admin approval)
   */
  async respondToOwnerChatRequest(requestId: string | number, approved: boolean): Promise<any> {
    try {
      const response = await apiClient.post(`/chats/requests/${requestId}/owner-respond/`, {
        approved,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in respondToOwnerChatRequest:', error);
      console.error('Error response:', error?.response?.data);
      throw error;
    }
  },

  /**
   * Create a chat request (new workflow)
   */
  async createChatRequest(targetId: number, message?: string, petId?: number, type?: string): Promise<any> {
    const response = await apiClient.post('/chats/request/', {
      target_id: targetId,
      message: message || '',
      pet_id: petId,
      type: type || 'general',
    });
    return response.data;
  },

  /**
   * Get my chat requests (as requester and target)
   */
  async getMyChatRequests(): Promise<any[]> {
    try {
      const response = await apiClient.get('/chats/requests/my/');
      const data = response.data;
      // Handle both array response and object with data property
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.data)) {
        return data.data;
      } else {
        console.warn('Unexpected response format from /chats/requests/my/', data);
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching my chat requests:', error);
      return [];
    }
  },

  /**
   * User accepts a chat request
   */
  async userAcceptRequest(requestId: number): Promise<any> {
    const response = await apiClient.patch(`/chats/requests/${requestId}/user-accept/`);
    return response.data;
  },

  /**
   * Get room messages by room_id
   */
  async getRoomMessages(roomId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/chats/rooms/${roomId}/messages/`);
      return response.data.data || response.data || [];
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },
};

