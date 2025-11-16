// Mock API service for development
// Replace with actual backend URLs when ready

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// Helper for mock delays
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user data
let currentUser: any = null;

// Mock data storage
const mockData = {
  pets: [] as any[],
  chats: [] as any[],
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
    
    return {
      items: filtered,
      total: filtered.length,
    };
  },

  async getById(id: string) {
    await mockDelay();
    initMockData();
    const pet = mockData.pets.find(p => p.id === id);
    if (!pet) throw new Error('Pet not found');
    return pet;
  },

  async create(petData: any) {
    await mockDelay();
    const newPet = {
      id: Date.now().toString(),
      ...petData,
      submitted_by: currentUser,
      date_submitted: new Date().toISOString(),
    };
    mockData.pets.push(newPet);
    return newPet;
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
  async createRoom(petId: string, ownerId: string) {
    await mockDelay();
    const roomId = `room-${Date.now()}`;
    mockData.chats.push({
      roomId,
      petId,
      participants: [ownerId, 'rescuer-id', 'admin-id'],
      messages: [],
    });
    return { roomId };
  },

  async getRoom(roomId: string) {
    await mockDelay();
    const room = mockData.chats.find(c => c.roomId === roomId);
    return room || {
      roomId,
      petId: 'unknown',
      participants: ['user1', 'user2', 'admin'],
      messages: [
        {
          id: '1',
          sender: { id: 'user1', name: 'Pet Owner' },
          text: 'Hello, I think this is my pet!',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          sender: { id: 'user2', name: 'Rescuer' },
          text: 'Great! Can you describe any unique features?',
          timestamp: new Date().toISOString(),
        },
      ],
    };
  },

  connectWebSocket(roomId: string) {
    // Mock WebSocket connection
    console.log(`WebSocket connected to ${WS_URL}/chats/${roomId}`);
    return {
      send: (message: any) => console.log('WS Send:', message),
      close: () => console.log('WS Closed'),
      on: (event: string, callback: Function) => console.log('WS Event:', event),
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
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch pending reports');
      const data = await response.json();
      return data.data;
    } catch (error) {
      // Fallback to mock
      return this.getPending(report_type);
    }
  },

  async acceptReport(petId: string, notes?: string) {
    const url = `${API_URL}/admin/pending/${petId}/accept`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error('Failed to accept report');
      const data = await response.json();
      return data.data;
    } catch (error) {
      // Fallback: simulate acceptance
      await mockDelay();
      const pet = mockData.pets.find(p => p.id === petId);
      if (!pet) throw new Error('Pet not found');
      pet.status = pet.report_type === 'found' ? 'Listed Found' : 'Listed Lost';
      return pet;
    }
  },

  async rejectReport(petId: string, reason: string) {
    const url = `${API_URL}/admin/pending/${petId}/reject`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject report');
      const data = await response.json();
      return data.data;
    } catch (error) {
      // Fallback: simulate rejection
      await mockDelay();
      const pet = mockData.pets.find(p => p.id === petId);
      if (!pet) throw new Error('Pet not found');
      pet.status = 'Rejected';
      return pet;
    }
  },

  async approvePet(id: string) {
    const pet = mockData.pets.find(p => p.id === id);
    if (!pet) throw new Error('Pet not found');
    
    const newStatus = pet.status.includes('Found') ? 'Listed Found' : 'Listed Lost';
    return petsAPI.update(id, { status: newStatus });
  },

  async getDashboardStats() {
    const url = `${API_URL}/admin/dashboard`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      return data.data;
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      initMockData();
      return {
        pending: {
          lost: 3,
          found: 2,
          total: 5,
        },
        active: {
          lost: 8,
          found: 12,
          total: 20,
        },
        matched: 15,
        reunited: 10,
        users: {
          total: 150,
          regular: 120,
          rescuers: 28,
          admins: 2,
        },
      };
    }
  },

  async getAllUsers(filters?: any) {
    await mockDelay();
    return [
      { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', is_active: true, createdAt: new Date() },
      { _id: '2', name: 'Sarah Smith', email: 'sarah@example.com', role: 'rescuer', is_active: true, createdAt: new Date() },
    ];
  },

  async updateUser(userId: string, updates: any) {
    await mockDelay();
    return { success: true, message: 'User updated' };
  },

  async deleteUser(userId: string) {
    await mockDelay();
    return { success: true, message: 'User deactivated' };
  },

  async getAllPets(filters?: any) {
    await mockDelay();
    initMockData();
    return mockData.pets;
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
  async getAll() {
    await mockDelay();
    return mockData.notifications;
  },

  async markRead(id: string) {
    await mockDelay();
    const notif = mockData.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    return { success: true };
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
