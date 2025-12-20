import apiClient from './apiClient';
import { AdminLog, SystemSettings, User, Pet } from '@/models';

export const adminApi = {
  /**
   * Get all admin logs
   */
  async getLogs(params?: {
    action?: string;
    model_type?: string;
    admin?: number;
  }): Promise<AdminLog[]> {
    const response = await apiClient.get<AdminLog[]>('/admin/logs/', { params });
    return response.data;
  },

  /**
   * Create admin log entry
   */
  async createLog(logData: {
    action: string;
    model_type: string;
    object_id: number;
    description: string;
    changes?: Record<string, any>;
  }): Promise<AdminLog> {
    const response = await apiClient.post<AdminLog>('/admin/logs/create/', logData);
    return response.data;
  },

  /**
   * Get all system settings
   */
  async getSettings(): Promise<SystemSettings[]> {
    const response = await apiClient.get<SystemSettings[]>('/admin/settings/');
    return response.data;
  },

  /**
   * Get system setting by key
   */
  async getSetting(key: string): Promise<SystemSettings> {
    const response = await apiClient.get<SystemSettings>(`/admin/settings/${key}/`);
    return response.data;
  },

  /**
   * Create system setting
   */
  async createSetting(setting: {
    key: string;
    value: string;
    description?: string;
  }): Promise<SystemSettings> {
    const response = await apiClient.post<SystemSettings>('/admin/settings/', setting);
    return response.data;
  },

  /**
   * Update system setting
   */
  async updateSetting(key: string, value: string): Promise<SystemSettings> {
    const response = await apiClient.put<SystemSettings>(`/admin/settings/${key}/`, { value });
    return response.data;
  },

  /**
   * Delete system setting
   */
  async deleteSetting(key: string): Promise<void> {
    await apiClient.delete(`/admin/settings/${key}/`);
  },

  /**
   * Get all users (admin only)
   */
  async getUsers(params?: {
    role?: string;
    search?: string;
  }): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/admin/users', { params });
      // Handle both response formats: {data: [...]} or [...]
      const users = response.data.data || response.data || [];
      return Array.isArray(users) ? users : [];
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Alias for getUsers (for compatibility)
   */
  async getAllUsers(params?: {
    role?: string;
    search?: string;
  }): Promise<User[]> {
    return this.getUsers(params);
  },

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<any> {
    const response = await apiClient.get('/admin/dashboard');
    return response.data.data || response.data;
  },

  /**
   * Get pending reports
   */
  async getPendingReports(report_type?: 'found' | 'lost'): Promise<Pet[]> {
    const params = report_type ? { report_type } : {};
    const response = await apiClient.get<Pet[]>('/admin/pending', { params });
    return response.data.data || response.data || [];
  },

  /**
   * Accept a pet report
   */
  async acceptReport(petId: string | number, notes?: string, verificationParams?: any): Promise<any> {
    const response = await apiClient.post(`/admin/pets/${petId}/approve`, {
      notes,
      type: verificationParams?.type,
    });
    return response.data.data || response.data;
  },

  /**
   * Reject a pet report
   */
  async rejectReport(petId: string | number, reason: string): Promise<any> {
    const response = await apiClient.post(`/admin/pets/${petId}/reject`, { reason });
    return response.data.data || response.data;
  },

  /**
   * Get pending adoption requests
   */
  async getPendingAdoptionRequests(): Promise<any[]> {
    const response = await apiClient.get('/admin/adoptions/pending');
    return response.data.data || response.data || [];
  },

  /**
   * Accept an adoption request
   */
  async acceptAdoptionRequest(petId: string | number, notes?: string, verificationParams?: any, adopterId?: string): Promise<any> {
    const response = await apiClient.post(`/admin/adoptions/${petId}/accept`, {
      notes,
      verification_params: {
        ...verificationParams,
        adopter_id: adopterId,
      },
    });
    return response.data.data || response.data;
  },

  /**
   * Get all chats
   */
  async getAllChats(): Promise<any[]> {
    try {
    const response = await apiClient.get('/admin/chats');
      const data = response.data.data || response.data || [];
      console.log('API Response:', {
        status: response.status,
        dataLength: Array.isArray(data) ? data.length : 0,
        hasError: !!response.data.error,
        error: response.data.error
      });
      return data;
    } catch (error: any) {
      console.error('Error in getAllChats:', error);
      console.error('Error response:', error?.response?.data);
      throw error;
    }
  },

  /**
   * Get chat statistics
   */
  async getChatStats(): Promise<any> {
    const response = await apiClient.get('/admin/chats/stats');
    return response.data.data || response.data || {
      pending_requests: 0,
      active_chats: 0,
      total_requests: 0,
      approved_requests: 0,
      rejected_requests: 0,
    };
  },

  /**
   * Get all chat requests
   */
  async getAllChatRequests(): Promise<any[]> {
    try {
      // Use the new endpoint from chats app instead of adminpanel
      const response = await apiClient.get('/chats/requests/all/');
    return response.data.data || response.data || [];
    } catch (error: any) {
      console.error('Error fetching chat requests:', error);
      // Fallback to empty array if endpoint fails
      return [];
    }
  },

  /**
   * Respond to a chat request
   */
  async respondToChatRequest(requestId: string | number, approved: boolean, adminNotes?: string): Promise<any> {
    const response = await apiClient.post(`/admin/chats/requests/${requestId}/respond`, {
      approved,
      admin_notes: adminNotes,
    });
    return response.data.data || response.data;
  },

  /**
   * Start verification for a chat request (new workflow)
   */
  async startVerification(requestId: number): Promise<any> {
    try {
      const response = await apiClient.post(`/chats/requests/${requestId}/admin-start-verification/`);
      return response.data;
    } catch (error: any) {
      console.error('startVerification error:', error);
      console.error('Request URL:', `/chats/requests/${requestId}/admin-start-verification/`);
      console.error('Request ID:', requestId);
      throw error;
    }
  },

  /**
   * Complete verification and add target user (new workflow)
   */
  async completeVerification(requestId: number, targetUserId?: number, adminNotes?: string): Promise<any> {
    const response = await apiClient.post(`/chats/requests/${requestId}/admin-complete-verification/`, {
      target_user_id: targetUserId,
      admin_notes: adminNotes || '',
    });
    return response.data;
  },

  /**
   * Approve a chat request (legacy - redirects to start verification)
   */
  async approveChatRequest(requestId: number, adminNotes?: string): Promise<any> {
    // Use the new verification workflow
    return this.startVerification(requestId);
  },

  /**
   * Reject a chat request (new workflow)
   */
  async rejectChatRequest(requestId: number, adminNotes?: string): Promise<any> {
    const response = await apiClient.patch(`/chats/requests/${requestId}/admin-reject/`, {
      admin_notes: adminNotes || '',
    });
    return response.data;
  },

  /**
   * Create a chat room (admin only)
   */
  async createChatRoom(userId: string | number): Promise<any> {
    try {
      const response = await apiClient.post('/admin/chats/rooms/', {
        user_id: userId,
        target_user_id: userId,
        participant_ids: [userId],
      });
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error creating chat room via admin API:', error);
      throw error;
    }
  },

  /**
   * Get a chat room (for admin monitoring)
   * Handles both numeric IDs and string IDs (like "3_6")
   */
  async getChatRoom(roomId: string | number): Promise<any> {
    try {
      // Try the regular chat rooms endpoint first
      const response = await apiClient.get(`/chats/rooms/${roomId}/`);
      return response.data.data || response.data;
    } catch (error: any) {
      // If 404, the room might use a different format - try without trailing slash
      if (error?.response?.status === 404) {
        try {
          const response = await apiClient.get(`/chats/rooms/${roomId}`);
          return response.data.data || response.data;
        } catch (retryError: any) {
          // If still fails, try admin-specific endpoint
          try {
            const response = await apiClient.get(`/admin/chats/${roomId}`);
            return response.data.data || response.data;
          } catch (adminError: any) {
            throw error; // Throw original error
          }
        }
      }
      throw error;
    }
  },

  /**
   * Close a chat room
   */
  async closeChat(roomId: string | number): Promise<any> {
    const response = await apiClient.post(`/admin/chats/${roomId}/close`);
    return response.data.data || response.data;
  },

  /**
   * Delete a chat room (permanently removes the chat room and all messages)
   */
  async deleteChat(roomId: string | number): Promise<any> {
    const response = await apiClient.delete(`/admin/chats/${roomId}`);
    return response.data.data || response.data;
  },

  /**
   * Create a chat request from admin to user (admin-initiated chat)
   */
  /**
   * Create a direct chat room between admin and user (no pet, no chat request).
   * This is for normal communication, not pet-related.
   */
  async createChatRequest(userId: string | number, message?: string): Promise<any> {
    try {
      // Admin endpoint creates a direct chat room (not a chat request)
      const response = await apiClient.post('/admin/chats/request/', {
        target_user_id: userId,
        user_id: userId,  // Support both field names
        message: message || 'Admin wants to connect with you.',
        type: 'admin_contact',
      });
      // Return the full response data structure
      const responseData = response.data.data || response.data;
      // If response has room_id at top level, include it
      if (response.data.room_id) {
        return { ...responseData, room_id: response.data.room_id };
      }
      return responseData;
    } catch (error: any) {
      console.error('Error creating direct chat room:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string | number): Promise<User> {
    const response = await apiClient.get<User>(`/auth/${userId}/`);
    return response.data.user || response.data;
  },

  /**
   * Update user
   */
  async updateUser(userId: string | number, updates: any): Promise<User> {
    const response = await apiClient.patch<User>(`/auth/${userId}/`, updates);
    return response.data.user || response.data;
  },

  /**
   * Delete/deactivate user
   */
  async deleteUser(userId: string | number): Promise<any> {
    const response = await apiClient.delete(`/auth/${userId}/`);
    return response.data;
  },

  /**
   * Get all pets
   */
  async getAllPets(filters?: any): Promise<Pet[]> {
    try {
      const response = await apiClient.get<Pet[]>('/admin/pets', { params: filters });
      // Handle both response formats: {data: [...]} or [...]
      const pets = response.data.data || response.data || [];
      return Array.isArray(pets) ? pets : [];
    } catch (error: any) {
      console.error('Error fetching pets:', error);
      throw error;
    }
  },

  /**
   * Approve pet
   */
  async approvePet(id: string | number): Promise<Pet> {
    const response = await apiClient.post<Pet>(`/admin/pets/${id}/approve`);
    return response.data.data || response.data;
  },

  /**
   * Resolve pet (placeholder)
   */
  async resolvePet(petId: string | number): Promise<any> {
    return { success: true, message: 'Pet resolved' };
  },

  /**
   * Delete pet (placeholder)
   */
  async deletePet(petId: string | number): Promise<any> {
    return { success: true, message: 'Pet deleted' };
  },

  /**
   * View chat in read-only mode (for admins who didn't verify the request)
   */
  async viewChatReadOnly(roomId: string): Promise<{
    room: any;
    messages: any[];
    participants: any[];
    is_readonly: boolean;
    is_verifying_admin: boolean;
    chat_request: any;
  }> {
    const response = await apiClient.get(`/chats/rooms/${roomId}/admin-view/`);
    return response.data;
  },
};

