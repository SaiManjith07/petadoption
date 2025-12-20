// Mock API service for development
// Replace with actual backend URLs when ready

const API_URL = import.meta.env.VITE_API_URL || 'https://petadoption-v2q3.onrender.com/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://petadoption-v2q3.onrender.com/ws';

// Get base URL for image serving (without /api)
const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://petadoption-v2q3.onrender.com/api';
  // Remove /api from the end if present
  return apiUrl.replace(/\/api\/?$/, '');
};

// Helper function to convert relative image paths to full URLs
export const getImageUrl = (imagePath: string | undefined | null): string | null => {
  if (!imagePath) return null;
  
  // If it's a data URL (base64), return as is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // If it's already a full URL (starts with http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path, prepend the base URL
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${baseUrl}${path}`;
};

// Helper for mock delays
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user data
let currentUser: any = null;

// Mock data storage
const mockData = {
  pets: [] as any[],
  chats: [] as any[],
  chatRequests: [] as any[],
  notifications: [] as any[],
};

// Initialize with some mock pets
const initMockData = () => {
  if (mockData.pets.length === 0) {
    mockData.pets = [
      {
        id: '1',
        status: 'Listed Found',
        species: 'Dog',
        breed: 'Golden Retriever',
        color: 'Golden',
        distinguishing_marks: 'White patch on chest, friendly demeanor',
        photos: ['https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800'],
        location: 'Central Park, New York',
        date_found_or_lost: '2024-01-10T10:00:00Z',
        submitted_by: { id: '1', name: 'John Rescuer', contact: 'john@example.com' },
        date_submitted: '2024-01-10T10:30:00Z',
      },
      {
        id: '2',
        status: 'Listed Lost',
        species: 'Cat',
        breed: 'Siamese',
        color: 'Cream with dark points',
        distinguishing_marks: 'Blue eyes, collar with bell',
        photos: ['https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=800'],
        location: 'Brooklyn Heights',
        date_found_or_lost: '2024-01-12T14:00:00Z',
        submitted_by: { id: '2', name: 'Sarah Owner', contact: 'sarah@example.com' },
        date_submitted: '2024-01-12T15:00:00Z',
      },
      {
        id: '3',
        status: 'Available for Adoption',
        species: 'Dog',
        breed: 'Mixed Breed',
        color: 'Brown and white',
        distinguishing_marks: 'Playful, good with kids',
        photos: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'],
        location: 'Animal Shelter NYC',
        date_found_or_lost: '2023-12-01T10:00:00Z',
        submitted_by: { id: '3', name: 'NYC Animal Shelter', contact: 'shelter@nyc.com' },
        date_submitted: '2023-12-01T11:00:00Z',
      },
    ];
  }
};

// Auth API
export const authAPI = {
  async login(email: string, password: string) {
    await mockDelay();
    currentUser = {
      id: '1',
      name: 'Test User',
      email,
      role: email.includes('admin') ? 'admin' : 'user',
    };
    return { token: 'mock-token-123', user: currentUser };
  },

  async register(payload: any) {
    await mockDelay();
    // Basic mock validation
    if (!payload.email || !payload.password) {
      const err: any = { errors: { email: ['Email required'], password: ['Password required'] } };
      const e: any = new Error('Validation');
      e.body = err;
      throw e;
    }
    currentUser = { id: Date.now().toString(), name: payload.name || payload.full_name || 'User', email: payload.email, role: payload.role || 'user', phone: payload.phone };
    return { user: currentUser };
  },

  async getMe() {
    await mockDelay();
    return currentUser;
  },

  logout() {
    currentUser = null;
  },
};

// Pets API
export const petsAPI = {
  async getAll(params: any = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.species) queryParams.append('species', params.species);
    if (params.location) queryParams.append('location', params.location);
    if (params.report_type) queryParams.append('report_type', params.report_type);
    
    const url = `${API_URL}/pets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch pets');
      const data = await response.json();
      return {
        items: data.data || [],
        total: data.pagination?.total || data.data?.length || 0,
      };
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      initMockData();
      
      let filtered = [...mockData.pets];
      
      if (params.status) {
        filtered = filtered.filter(p => p.status === params.status);
      }
      if (params.species) {
        filtered = filtered.filter(p => p.species === params.species);
      }
      if (params.location) {
        filtered = filtered.filter(p => p.location.toLowerCase().includes(params.location.toLowerCase()));
      }
      if (params.report_type) {
        filtered = filtered.filter(p => p.report_type === params.report_type);
      }
      
      return {
        items: filtered,
        total: filtered.length,
      };
    }
  },

  async getById(id: string) {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('Invalid pet ID');
    }
    const url = `${API_URL}/pets/${id}`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Pet not found');
        }
        if (response.status === 500) {
          throw new Error(`Server error: Invalid pet ID format`);
        }
        throw new Error(`Failed to fetch pet: ${response.status}`);
      }
      const data = await response.json();
      const pet = data.data || data;
      // Ensure pet has an id field (use _id if id doesn't exist)
      if (pet && !pet.id && pet._id) {
        pet.id = pet._id;
      }
      return pet;
    } catch (error: any) {
      // Fallback to mock
      await mockDelay();
      initMockData();
      const pet = mockData.pets.find(p => p.id === id || p._id === id);
      if (!pet) throw new Error('Pet not found');
      return pet;
    }
  },

  async create(petData: any) {
    // Determine endpoint based on report_type or status
    const reportType = petData.report_type || (petData.status?.includes('Found') ? 'found' : petData.status?.includes('Lost') ? 'lost' : 'found');
    const endpoint = reportType === 'lost' ? '/pets/lost' : '/pets/found';
    
    // Create FormData for multipart/form-data
    const formData = new FormData();
    
    // Add all text fields
    Object.keys(petData).forEach(key => {
      if (key !== 'photos' && key !== 'report_type' && petData[key] !== undefined && petData[key] !== null) {
        if (typeof petData[key] === 'object') {
          formData.append(key, JSON.stringify(petData[key]));
        } else {
          formData.append(key, petData[key]);
        }
      }
    });
    
    // Add report_type
    formData.append('report_type', reportType);
    
    // Add photos - multer expects field name 'photos' (plural)
    if (petData.photos && Array.isArray(petData.photos)) {
      petData.photos.forEach((photo: any, index: number) => {
        if (photo instanceof File) {
          formData.append('photos', photo, photo.name); // Include filename for better backend handling
        } else {
          console.warn('Photo at index', index, 'is not a File object:', photo);
        }
      });
    } else {
      console.warn('No photos array found in petData or photos is not an array');
    }
    
    try {
      const token = localStorage.getItem('token');
      const url = `${API_URL}${endpoint}`;
      
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create pet report' }));
        
        // If there are specific validation errors, format them
        if (errorData.errors && typeof errorData.errors === 'object') {
          const errorMessages = Object.entries(errorData.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
          throw new Error(`Validation failed:\n${errorMessages}`);
        }
        
        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error: any) {
      // Log error for debugging
      console.error('Error creating pet report:', error);
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error(
          'Cannot connect to server. Please ensure:\n' +
          '1. Backend server is running on http://localhost:8000\n' +
          '2. Check browser console for CORS errors\n' +
          '3. Verify your network connection'
        );
      }
      
      // Re-throw error so frontend can handle it
      throw new Error(error.message || 'Failed to create pet report. Please check your connection and try again.');
    }
  },

  async update(id: string, updates: any) {
    await mockDelay();
    const index = mockData.pets.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Pet not found');
    mockData.pets[index] = { ...mockData.pets[index], ...updates };
    return mockData.pets[index];
  },

  async delete(id: string) {
    await mockDelay();
    mockData.pets = mockData.pets.filter(p => p.id !== id);
    return { success: true };
  },

  async getMatches(species?: string, color?: string, location?: string) {
    await mockDelay(300);
    initMockData();
    
    let matches = mockData.pets.filter(p => p.status === 'Listed Found');
    
    if (species) {
      matches = matches.filter(p => 
        p.species.toLowerCase().includes(species.toLowerCase())
      );
    }
    if (color) {
      matches = matches.filter(p => 
        p.color.toLowerCase().includes(color.toLowerCase())
      );
    }
    if (location) {
      matches = matches.filter(p => 
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    return matches;
  },

  async applyForAdoption(id: string, application: any) {
    await mockDelay();
    return { success: true, application };
  },

  async moveToAdoption(id: string) {
    return this.update(id, { status: 'Available for Adoption' });
  },

  async rescuerKeep(id: string) {
    return this.update(id, { status: 'Adopted (by Rescuer)' });
  },
};

// Chat API
export const chatAPI = {
  // Request chat with pet owner/finder
  async requestChat(petId: string, requesterId: string, type: 'claim' | 'adoption', message?: string) {
    const url = `${API_URL}/chats/request`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ petId, type, message: message || '' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create chat request' }));
        throw new Error(errorData.message || 'Failed to create chat request');
      }
      const data = await response.json();
      return data.data;
    } catch (error: any) {
      // Fallback to mock
      await mockDelay();
      const requestId = `request-${Date.now()}`;
      const request = {
        id: requestId,
        petId,
        requesterId,
        type,
        message: message || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      if (!mockData.chatRequests) mockData.chatRequests = [];
      mockData.chatRequests.push(request);
      return request;
    }
  },

  // Get chat requests for a user (pending approvals)
  async getChatRequests(userId: string) {
    const url = `${API_URL}/chats/requests`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch chat requests');
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      // In production, filter by userId from backend
      return mockData.chatRequests || [];
    }
  },

  // Approve or reject chat request
  async respondToChatRequest(requestId: string, approved: boolean) {
    const url = `${API_URL}/chats/requests/${requestId}/respond`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to respond to chat request' }));
        throw new Error(errorData.message || 'Failed to respond to chat request');
      }
      const data = await response.json();
      return data.data;
    } catch (error: any) {
      // Fallback to mock
      await mockDelay();
      if (!mockData.chatRequests) return null;
      const request = mockData.chatRequests.find(r => r.id === requestId);
      if (!request) return null;
      
      request.status = approved ? 'approved' : 'rejected';
      request.respondedAt = new Date().toISOString();
      
      if (approved) {
        // Create chat room when approved (admin will be added by backend)
        const roomId = `room-${Date.now()}`;
        const room = {
          roomId,
          petId: request.petId,
          type: request.type,
          participants: [request.requesterId, currentUser?.id || 'owner-id'],
          messages: [],
          createdAt: new Date().toISOString(),
        };
        if (!mockData.chats) mockData.chats = [];
        mockData.chats.push(room);
        request.roomId = roomId;
      }
      
      return request;
    }
  },

  // Get all chats for a user (only adoption and found pet claims)
  async getUserChats(userId: string) {
    const url = `${API_URL}/chats`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch user chats');
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      const chats = mockData.chats || [];
      // Filter chats where user is a participant
      return chats.filter(chat => 
        chat.participants?.includes(userId) || 
        chat.participants?.includes(currentUser?.id || '')
      );
    }
  },

  // Create room directly (for admin or approved chats)
  async createRoom(petId: string, ownerId: string, type: 'claim' | 'adoption' = 'claim') {
    await mockDelay();
    const roomId = `room-${Date.now()}`;
    const room = {
      roomId,
      petId,
      type,
      participants: [ownerId, currentUser?.id || 'requester-id'],
      messages: [],
      createdAt: new Date().toISOString(),
    };
    if (!mockData.chats) mockData.chats = [];
    mockData.chats.push(room);
    return { roomId };
  },

  async getRoom(roomId: string) {
    const url = `${API_URL}/chats/${roomId}`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Chat room not found');
        }
        throw new Error('Failed to fetch chat room');
      }
      const data = await response.json();
      return data.data;
    } catch (error: any) {
      // Fallback to mock
      await mockDelay();
      const room = mockData.chats?.find(c => c.roomId === roomId);
      if (room) {
        return {
          ...room,
          messages: room.messages || [
            {
              id: '1',
              sender: { id: room.participants[0], name: 'Pet Owner' },
              text: room.type === 'adoption' ? 'Thank you for your interest in adopting!' : 'Hello, I think this is my pet!',
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      throw new Error('Chat room not found');
    }
  },

  async sendMessage(roomId: string, senderId: string, text: string) {
    const url = `${API_URL}/chats/${roomId}/message`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to send message' }));
        throw new Error(errorData.message || 'Failed to send message');
      }
      const data = await response.json();
      return data.data;
    } catch (error: any) {
      // Fallback to mock
      await mockDelay();
      const room = mockData.chats?.find(c => c.roomId === roomId);
      if (room) {
        const message = {
          id: `msg-${Date.now()}`,
          sender: { id: senderId, name: currentUser?.name || 'User' },
          text,
          timestamp: new Date().toISOString(),
        };
        if (!room.messages) room.messages = [];
        room.messages.push(message);
        return message;
      }
      throw new Error('Room not found');
    }
  },

  connectWebSocket(roomId: string) {
    // Mock WebSocket connection
    return {
      send: (message: any) => {},
      close: () => {},
      on: (event: string, callback: Function) => {},
    };
  },
};

// Admin API
export const adminAPI = {
  async getPending(type?: 'found' | 'lost') {
    await mockDelay();
    initMockData();
    // Return pending verification reports
    return mockData.pets.filter(p => p.status === 'Pending Verification');
  },

  async getPendingReports(report_type?: 'found' | 'lost') {
    const url = `${API_URL}/admin/pending${report_type ? `?report_type=${report_type}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch pending reports');
    }
    const data = await response.json();
    return data.data || [];
  },

  async acceptReport(petId: string, notes?: string, verificationParams?: any) {
    const url = `${API_URL}/admin/pending/${petId}/accept`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        notes,
        verification_params: verificationParams 
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to accept report');
    }
    const data = await response.json();
    return data.data;
  },

  async getPendingAdoptionRequests() {
    const url = `${API_URL}/admin/adoptions/pending`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch pending adoptions');
    }
    const data = await response.json();
    return data.data || [];
  },

  async acceptAdoptionRequest(petId: string, notes?: string, verificationParams?: any, adopterId?: string) {
    const url = `${API_URL}/admin/adoptions/${petId}/accept`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          notes,
          verification_params: {
            ...verificationParams,
            adopter_id: adopterId
          }
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept adoption request');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  async rejectReport(petId: string, reason: string) {
    const url = `${API_URL}/admin/pending/${petId}/reject`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to reject report');
    }
    const data = await response.json();
    return data.data;
  },

  async approvePet(id: string) {
    const pet = mockData.pets.find(p => p.id === id);
    if (!pet) throw new Error('Pet not found');
    
    const newStatus = pet.status.includes('Found') ? 'Listed Found' : 'Listed Lost';
    return petsAPI.update(id, { status: newStatus });
  },

  async getDashboardStats() {
    const url = `${API_URL}/admin/dashboard`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch dashboard stats');
    }
    const data = await response.json();
    return data.data;
  },

  async getAllUsers(filters?: any) {
    const url = `${API_URL}/admin/users${filters ? `?${new URLSearchParams(filters).toString()}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch users');
    }
    const data = await response.json();
    return data.data || [];
  },

  async getUserById(userId: string) {
    const url = `${API_URL}/admin/users/${userId}`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  async updateUser(userId: string, updates: any) {
    const url = `${API_URL}/admin/users/${userId}`;
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteUser(userId: string) {
    const url = `${API_URL}/admin/users/${userId}`;
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deactivate user');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Chat Management Functions
  async getAllChatRequests() {
    const url = `${API_URL}/admin/chats/requests`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch chat requests');
    }
    const data = await response.json();
    return data.data || [];
  },

  async getAllChats() {
    const url = `${API_URL}/admin/chats`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch chats');
    }
    const data = await response.json();
    return data.data || [];
  },

  async getChatStats() {
    const url = `${API_URL}/admin/chats/stats`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch chat stats');
    }
    const data = await response.json();
    return data.data || {
      pending_requests: 0,
      active_chats: 0,
      total_requests: 0,
      approved_requests: 0,
      rejected_requests: 0,
    };
  },

  async respondToChatRequest(requestId: string, approved: boolean, adminNotes?: string) {
    const url = `${API_URL}/admin/chats/requests/${requestId}/respond`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approved, admin_notes: adminNotes }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to respond to chat request');
    }
    const data = await response.json();
    return data.data;
  },

  async getChatRoom(roomId: string) {
    const url = `${API_URL}/admin/chats/${roomId}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch chat room');
    }
    const data = await response.json();
    return data.data;
  },

  async closeChat(roomId: string) {
    const url = `${API_URL}/admin/chats/${roomId}/close`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to close chat');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getAllPets(filters?: any) {
    const url = `${API_URL}/admin/pets${filters ? `?${new URLSearchParams(filters).toString()}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch pets');
    }
    const data = await response.json();
    return data.data || [];
  },

  async resolvePet(petId: string) {
    await mockDelay();
    return { success: true, message: 'Pet resolved' };
  },

  async deletePet(petId: string) {
    await mockDelay();
    return { success: true, message: 'Pet deleted' };
  },
};

// Notifications API
export const notificationsAPI = {
  async getAll(isRead?: boolean) {
    const url = `${API_URL}/notifications${isRead !== undefined ? `?is_read=${isRead}` : ''}`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      return mockData.notifications || [];
    }
  },

  async getUnreadCount() {
    const url = `${API_URL}/notifications/unread-count`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      return 0;
    }
  },

  async markRead(id: string) {
    const url = `${API_URL}/notifications/${id}/read`;
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      const data = await response.json();
      return data;
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      const notif = mockData.notifications?.find((n: any) => n.id === id);
      if (notif) notif.is_read = true;
      return { success: true };
    }
  },

  async markAllAsRead() {
    const url = `${API_URL}/notifications/read-all`;
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false };
    }
  },

  async delete(id: string) {
    const url = `${API_URL}/notifications/${id}`;
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },
};

// Uploads API
export const uploadsAPI = {
  async upload(file: File) {
    await mockDelay();
    // In production, this would upload to S3 or similar
    return {
      url: URL.createObjectURL(file),
    };
  },
};

// Users API (for user profile management)
export const usersAPI = {
  async updateUser(userId: string, updates: any) {
    const url = `${API_URL}/users/${userId}`;
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update user' }));
        throw new Error(error.message || error.detail || 'Failed to update user');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async getUser(userId: string) {
    const url = `${API_URL}/users/${userId}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      return data.user || data;
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      return currentUser;
    }
  },

  async updatePassword(currentPassword: string, newPassword: string) {
    const url = `${API_URL}/auth/update-password`;
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update password' }));
        throw new Error(error.message || 'Failed to update password');
      }
      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update password');
    }
  },
};

// Role Request API
export const roleRequestAPI = {
  async create(requested_role: string, reason?: string, experience?: string, availability?: string, resources?: any) {
    const url = `${API_URL}/role-requests`;
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requested_role, reason, experience, availability, resources }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create role request' }));
        throw new Error(error.message || error.detail || 'Failed to create role request');
      }
      const data = await response.json();
      return data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create role request');
    }
  },

  async getMy() {
    const url = `${API_URL}/role-requests/my`;
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No access token found for role requests');
        return [];
      }
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Unauthorized access to role requests');
          return [];
        }
        throw new Error(`Failed to fetch role requests: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching role requests:', error);
      return [];
    }
  },

  async getPending() {
    const url = `${API_URL}/role-requests/pending`;
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No access token found for pending role requests');
        return [];
      }
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Unauthorized access to pending role requests');
          return [];
        }
        throw new Error(`Failed to fetch pending role requests: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching pending role requests:', error);
      return [];
    }
  },
};

// Shelter Capacity API
export const shelterAPI = {
  async getAll(params?: any) {
    const queryParams = new URLSearchParams();
    if (params?.pincode) queryParams.append('pincode', params.pincode);
    if (params?.city) queryParams.append('city', params.city);
    if (params?.min_available) queryParams.append('min_available', params.min_available);
    
    const url = `${API_URL}/shelters${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch shelters');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      return [];
    }
  },

  async createOrUpdate(shelterData: any) {
    const url = `${API_URL}/shelters`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shelterData),
      });
      if (!response.ok) throw new Error('Failed to update shelter capacity');
      const data = await response.json();
      return data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update shelter capacity');
    }
  },
};

// Home Check API
export const homeCheckAPI = {
  async create(pet_id: string, adopter_id: string, check_type: 'pre_adoption' | 'post_adoption', scheduled_date: string) {
    const url = `${API_URL}/home-checks`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pet_id, adopter_id, check_type, scheduled_date }),
      });
      if (!response.ok) throw new Error('Failed to create home check');
      const data = await response.json();
      return data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create home check');
    }
  },

  async getMy() {
    const url = `${API_URL}/home-checks/my`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch home checks');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      return [];
    }
  },
};

// Feeding Point API
export const feedingPointAPI = {
  async getAll(params?: any) {
    const queryParams = new URLSearchParams();
    if (params?.pincode) queryParams.append('pincode', params.pincode);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.lat) queryParams.append('lat', params.lat);
    if (params?.lng) queryParams.append('lng', params.lng);
    if (params?.radius) queryParams.append('radius', params.radius);
    
    const url = `${API_URL}/feeding-points${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.error('Failed to fetch feeding points:', response.status);
        return [];
      }
      const data = await response.json();
      // Backend returns {'data': [...]} format
      return Array.isArray(data) ? data : (data.data || data || []);
    } catch (error) {
      console.error('Error fetching feeding points:', error);
      return [];
    }
  },

  async create(feedingPointData: any) {
    const url = `${API_URL}/feeding-points/create/`;
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedingPointData),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create feeding point' }));
        throw new Error(error.message || error.detail || 'Failed to create feeding point');
      }
      const data = await response.json();
      return data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create feeding point');
    }
  },
};

// Neighborhood Alert API
export const alertAPI = {
  async getByPincode(pincode: string) {
    const url = `${API_URL}/alerts/pincode/${pincode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      return [];
    }
  },

  async create(alertData: any) {
    const url = `${API_URL}/alerts`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });
      if (!response.ok) throw new Error('Failed to create alert');
      const data = await response.json();
      return data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create alert');
    }
  },

  async getMy() {
    const url = `${API_URL}/alerts/my`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      return [];
    }
  },
};
