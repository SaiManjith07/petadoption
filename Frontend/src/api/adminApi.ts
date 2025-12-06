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
    const response = await apiClient.get('/admin/chats');
    return response.data.data || response.data || [];
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
    const response = await apiClient.get('/admin/chats/requests');
    return response.data.data || response.data || [];
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
   * Get a chat room
   */
  async getChatRoom(roomId: string | number): Promise<any> {
    const response = await apiClient.get(`/admin/chats/${roomId}`);
    return response.data.data || response.data;
  },

  /**
   * Close a chat room
   */
  async closeChat(roomId: string | number): Promise<any> {
    const response = await apiClient.post(`/admin/chats/${roomId}/close`);
    return response.data.data || response.data;
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
};

