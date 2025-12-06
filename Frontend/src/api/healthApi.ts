import apiClient from './apiClient';

export interface VaccinationCamp {
  id: number;
  location: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  date: string;
  start_time: string;
  end_time: string;
  time?: string; // Formatted time string
  ngo: string;
  ngo_contact?: string;
  ngo_email?: string;
  description?: string;
  registration_link?: string;
  max_capacity: number;
  current_registrations: number;
  is_active: boolean;
  is_upcoming?: boolean;
  available_slots?: number;
  is_full?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampRegistration {
  id: number;
  camp: number;
  camp_details?: VaccinationCamp;
  user: number;
  user_name?: string;
  user_email?: string;
  pet_name: string;
  pet_type: string;
  pet_age?: string;
  contact_phone: string;
  contact_email?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  registered_at: string;
  updated_at: string;
}

export interface HealthResource {
  id: number;
  title: string;
  resource_type: 'vaccination' | 'first_aid' | 'microchipping' | 'general';
  content: string;
  short_description?: string;
  image?: string;
  image_url?: string;
  external_link?: string;
  is_featured: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export const healthApi = {
  /**
   * Get all vaccination camps
   */
  async getCamps(params?: {
    upcoming?: boolean;
    city?: string;
    state?: string;
    pincode?: string;
  }): Promise<VaccinationCamp[]> {
    const response = await apiClient.get<any>('/health/camps/', { params });
    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data?.items && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    return [];
  },

  /**
   * Get vaccination camp by ID
   */
  async getCampById(id: number): Promise<VaccinationCamp> {
    const response = await apiClient.get<VaccinationCamp>(`/health/camps/${id}/`);
    return response.data;
  },

  /**
   * Create vaccination camp (admin only)
   */
  async createCamp(campData: Partial<VaccinationCamp>): Promise<VaccinationCamp> {
    const response = await apiClient.post<VaccinationCamp>('/health/camps/', campData);
    return response.data;
  },

  /**
   * Update vaccination camp (admin only)
   */
  async updateCamp(id: number, campData: Partial<VaccinationCamp>): Promise<VaccinationCamp> {
    const response = await apiClient.put<VaccinationCamp>(`/health/camps/${id}/`, campData);
    return response.data;
  },

  /**
   * Delete vaccination camp (admin only)
   */
  async deleteCamp(id: number): Promise<void> {
    await apiClient.delete(`/health/camps/${id}/`);
  },

  /**
   * Register for a vaccination camp
   */
  async registerForCamp(registrationData: {
    camp: number;
    pet_name: string;
    pet_type: string;
    pet_age?: string;
    contact_phone: string;
    contact_email?: string;
    notes?: string;
  }): Promise<CampRegistration> {
    const response = await apiClient.post<CampRegistration>('/health/registrations/', registrationData);
    return response.data;
  },

  /**
   * Get user's camp registrations
   */
  async getMyRegistrations(): Promise<CampRegistration[]> {
    const response = await apiClient.get<CampRegistration[]>('/health/registrations/');
    return response.data;
  },

  /**
   * Get camp registration by ID
   */
  async getRegistrationById(id: number): Promise<CampRegistration> {
    const response = await apiClient.get<CampRegistration>(`/health/registrations/${id}/`);
    return response.data;
  },

  /**
   * Cancel camp registration
   */
  async cancelRegistration(id: number): Promise<CampRegistration> {
    const response = await apiClient.patch<CampRegistration>(`/health/registrations/${id}/`, {
      status: 'cancelled',
    });
    return response.data;
  },

  /**
   * Get all health resources
   */
  async getResources(params?: {
    type?: 'vaccination' | 'first_aid' | 'microchipping' | 'general';
    featured?: boolean;
  }): Promise<HealthResource[]> {
    const response = await apiClient.get<HealthResource[]>('/health/resources/', { params });
    return response.data;
  },

  /**
   * Get health resource by ID
   */
  async getResourceById(id: number): Promise<HealthResource> {
    const response = await apiClient.get<HealthResource>(`/health/resources/${id}/`);
    return response.data;
  },

  /**
   * Create health resource (admin only)
   */
  async createResource(resourceData: Partial<HealthResource>): Promise<HealthResource> {
    const response = await apiClient.post<HealthResource>('/health/resources/', resourceData);
    return response.data;
  },

  /**
   * Update health resource (admin only)
   */
  async updateResource(id: number, resourceData: Partial<HealthResource>): Promise<HealthResource> {
    const response = await apiClient.put<HealthResource>(`/health/resources/${id}/`, resourceData);
    return response.data;
  },

  /**
   * Delete health resource (admin only)
   */
  async deleteResource(id: number): Promise<void> {
    await apiClient.delete(`/health/resources/${id}/`);
  },
};

