import apiClient from './apiClient';
import { Pet, Category, AdoptionApplication, PaginatedResponse } from '@/models';

export const petsApi = {
  /**
   * Get all pets with optional filters
   */
  async getAll(params?: {
    status?: string;
    category?: string;
    location?: string;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<Pet>> {
    const response = await apiClient.get<PaginatedResponse<Pet>>('/pets/', {
      params,
    });
    return response.data;
  },

  /**
   * Get pet by ID
   */
  async getById(id: number): Promise<Pet> {
    const response = await apiClient.get<Pet>(`/pets/${id}/`);
    return response.data;
  },

  /**
   * Create a new pet
   */
  async create(petData: FormData | Partial<Pet>, reportType?: 'lost' | 'found'): Promise<Pet> {
    // For FormData, don't set Content-Type header - browser will set it with boundary
    const config = petData instanceof FormData
      ? { headers: {} } // Let browser set Content-Type with boundary
      : { headers: { 'Content-Type': 'application/json' } };
    
    // Use specific endpoint for lost/found reports
    // Backend routes: /api/lost/ and /api/found/ (not /api/pets/lost/)
    const endpoint = reportType === 'lost' ? '/lost/' : reportType === 'found' ? '/found/' : '/pets/';
    
    const response = await apiClient.post<Pet>(endpoint, petData, config);
    return response.data;
  },

  /**
   * Update pet
   */
  async update(id: number, updates: Partial<Pet> | FormData): Promise<Pet> {
    // For FormData, don't set Content-Type header - browser will set it with boundary
    const config = updates instanceof FormData
      ? { headers: {} } // Let browser set Content-Type with boundary
      : { headers: { 'Content-Type': 'application/json' } };
    
    const response = await apiClient.put<Pet>(`/pets/${id}/`, updates, config);
    return response.data;
  },

  /**
   * Delete pet
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/pets/${id}/`);
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/pets/categories/');
    return response.data;
  },

  /**
   * Apply for pet adoption
   */
  async applyForAdoption(petId: number, message?: string): Promise<AdoptionApplication> {
    const response = await apiClient.post<AdoptionApplication>(`/pets/${petId}/apply/`, {
      message: message || '',
    });
    return response.data;
  },

  /**
   * Get adoption applications
   */
  async getApplications(): Promise<AdoptionApplication[]> {
    const response = await apiClient.get<AdoptionApplication[]>('/pets/applications/');
    return response.data;
  },

  /**
   * Get adoption application by ID
   */
  async getApplication(id: number): Promise<AdoptionApplication> {
    const response = await apiClient.get<AdoptionApplication>(`/pets/applications/${id}/`);
    return response.data;
  },

  /**
   * Get matches for lost/found pets (search found pets when reporting lost)
   */
  async getMatches(species?: string, color?: string, location?: string): Promise<Pet[]> {
    const params: any = {
      status: 'Found', // Search found pets when reporting lost
    };
    if (species) {
      params.search = species;
    }
    if (location) {
      params.location = location;
    }
    const response = await apiClient.get<PaginatedResponse<Pet>>('/pets/', { params });
    let results = response.data.results || response.data.data || [];
    // Filter by color if provided
    if (color) {
      results = results.filter((pet: Pet) => 
        pet.description?.toLowerCase().includes(color.toLowerCase()) ||
        pet.name?.toLowerCase().includes(color.toLowerCase())
      );
    }
    return results;
  },

  /**
   * Medical Records API (Admin only)
   */
  medicalRecords: {
    /**
     * Get all medical records (optionally filtered by pet_id)
     */
    async getAll(petId?: number): Promise<any[]> {
      const params = petId ? { pet_id: petId } : {};
      const response = await apiClient.get<any[]>('/pets/medical-records/', { params });
      return response.data.data || response.data || [];
    },

    /**
     * Get medical records for a specific pet
     */
    async getByPetId(petId: number): Promise<any[]> {
      const response = await apiClient.get<any[]>(`/pets/${petId}/medical-records/`);
      return response.data.data || response.data || [];
    },

    /**
     * Get a single medical record by ID
     */
    async getById(id: number): Promise<any> {
      const response = await apiClient.get<any>(`/pets/medical-records/${id}/`);
      return response.data;
    },

    /**
     * Create a new medical record
     */
    async create(medicalData: any): Promise<any> {
      const response = await apiClient.post<any>('/pets/medical-records/', medicalData);
      return response.data;
    },

    /**
     * Update a medical record
     */
    async update(id: number, updates: any): Promise<any> {
      const response = await apiClient.put<any>(`/pets/medical-records/${id}/`, updates);
      return response.data;
    },

    /**
     * Delete a medical record
     */
    async delete(id: number): Promise<void> {
      await apiClient.delete(`/pets/medical-records/${id}/`);
    },
  },
};

