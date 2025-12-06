import apiClient from './apiClient';
import { User, LoginResponse, AuthTokens } from '@/models';

export const authApi = {
  /**
   * Register a new user
   */
  async register(payload: {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
    role?: 'user' | 'rescuer' | 'shelter';
    phone?: string;
    country_code?: string;
    pincode?: string;
    age?: number;
    gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    address?: string;
    landmark?: string;
  }): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register/', payload);
    return response.data;
  },

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login/', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  async getMe(): Promise<{ user: User }> {
    const response = await apiClient.get<{ user: User }>('/auth/me/');
    return response.data;
  },

  /**
   * Check if email is available
   */
  async checkEmail(email: string): Promise<{ exists: boolean }> {
    const response = await apiClient.get<{ exists: boolean }>('/auth/check-email/', {
      params: { email },
    });
    return response.data;
  },

  /**
   * Check if phone is available
   */
  async checkPhone(phone: string): Promise<{ exists: boolean }> {
    const response = await apiClient.get<{ exists: boolean }>('/auth/check-phone/', {
      params: { phone },
    });
    return response.data;
  },

  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile/');
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile/', updates);
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    const response = await apiClient.post<{ access: string }>('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  /**
   * Request admin registration - generates PIN
   */
  async requestAdminRegistration(payload: {
    email: string;
    name: string;
    phone: string;
    country_code: string;
    pincode: string;
    region: string;
    organization?: string;
  }): Promise<{ message: string; pin: string; email: string; expires_at: string }> {
    const response = await apiClient.post('/users/admin/register/request/', payload);
    return response.data;
  },

  /**
   * Verify admin PIN and create account
   */
  async verifyAdminPIN(payload: {
    email: string;
    pin: string;
    password: string;
    confirm_password: string;
  }): Promise<LoginResponse> {
    const response = await apiClient.post('/users/admin/register/verify/', payload);
    return response.data;
  },
};

