// TypeScript models/interfaces matching Django backend

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'rescuer' | 'shelter' | 'admin';
  phone?: string;
  country_code?: string;
  pincode?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  address?: string;
  landmark?: string;
  profile_image?: string;
  date_joined?: string;
  last_login?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  created_at?: string;
}

export interface Pet {
  id: number;
  name: string;
  breed?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Unknown';
  size?: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  description?: string;
  category?: Category;
  category_id?: number;
  adoption_status: 'Available for Adoption' | 'Adopted' | 'Pending' | 'Lost' | 'Found' | 'Reunited';
  location?: string;
  pincode?: string;
  last_seen?: string;
  image?: string;
  image_url?: string;
  owner?: number;
  posted_by?: User;
  images?: PetImage[];
  created_at?: string;
  updated_at?: string;
  is_verified?: boolean;
  is_featured?: boolean;
  views_count?: number;
}

export interface PetImage {
  id: number;
  image: string;
  caption?: string;
  created_at?: string;
}

export interface AdoptionApplication {
  id: number;
  pet: Pet;
  pet_id: number;
  applicant: User;
  message?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';
  applied_at?: string;
  reviewed_at?: string;
  reviewed_by?: User;
}

export interface ChatRoom {
  id: number;
  participants: User[];
  participant_ids?: number[];
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  last_message?: Message;
  unread_count?: number;
  other_participant?: User;
}

export interface Message {
  id: number;
  room: number;
  sender: User;
  content: string;
  read_status: boolean;
  created_at: string;
}

export interface AdminLog {
  id: number;
  admin: User;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'VERIFY' | 'FEATURE' | 'UNFEATURE';
  model_type: string;
  object_id: number;
  description: string;
  changes?: Record<string, any>;
  ip_address?: string;
  created_at?: string;
}

export interface SystemSettings {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_by?: User;
  updated_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  token: string;
  refresh: string;
  user: User;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

