import apiClient from './apiClient';

/**
 * Shelter API
 */
export const shelterApi = {
  /**
   * Get current user's shelter registration
   */
  async getMyShelter(): Promise<any> {
    const response = await apiClient.get('shelter-registrations/my/');
    return response.data.data || null;
  },

  /**
   * Get all shelter registrations (admin only)
   */
  async getAllShelters(): Promise<any[]> {
    const response = await apiClient.get('shelter-registrations/all/');
    return response.data.data || [];
  },

  /**
   * Register a new shelter
   */
  async registerShelter(shelterData: any): Promise<any> {
    const response = await apiClient.post('users/shelter/register/', shelterData);
    return response.data;
  },

  /**
   * Update shelter registration
   */
  async updateShelter(shelterId: string | number, shelterData: any): Promise<any> {
    const response = await apiClient.put(`shelter-registrations/${shelterId}`, shelterData);
    return response.data;
  },

  /**
   * Approve shelter (admin only)
   */
  async approveShelter(shelterId: string | number): Promise<any> {
    const response = await apiClient.post(`shelter-registrations/${shelterId}/approve`);
    return response.data;
  },

  /**
   * Reject shelter (admin only)
   */
  async rejectShelter(shelterId: string | number): Promise<any> {
    const response = await apiClient.post(`shelter-registrations/${shelterId}/reject`);
    return response.data;
  },
};

