import apiClient from './apiClient';
import { NotificationModel } from '@/models';

/**
 * Notifications API
 */
export const notificationsApi = {
  /**
   * Get all notifications for the current user
   */
  async getAll(params?: { is_read?: boolean }): Promise<NotificationModel[]> {
    const queryParams = new URLSearchParams();
    if (params?.is_read !== undefined) {
      queryParams.append('is_read', params.is_read.toString());
    }
    
    const url = `notifications/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    try {
      const response = await apiClient.get(url);
      // Handle both paginated and non-paginated responses
      return response.data.results || response.data || [];
    } catch (error: any) {
      // If connection is reset or server error, return empty array
      if (error.code === 'ERR_CONNECTION_RESET' || error.code === 'ECONNRESET') {
        console.warn('Notifications API connection reset, returning empty array');
        return [];
      }
      throw error;
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('notifications/unread-count/');
    return response.data.count || 0;
  },

  /**
   * Mark a notification as read
   */
  async markRead(id: number): Promise<NotificationModel> {
    const response = await apiClient.patch(`notifications/${id}/read/`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.patch('notifications/read-all/');
    return response.data;
  },

  /**
   * Get a single notification
   */
  async getById(id: number): Promise<NotificationModel> {
    const response = await apiClient.get(`notifications/${id}/`);
    return response.data;
  },

  /**
   * Delete a notification
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`notifications/${id}/`);
  },
};

