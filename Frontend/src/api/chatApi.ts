import apiClient from './apiClient';
import { ChatRoom, Message } from '@/models';

export const chatApi = {
  /**
   * Get all chat rooms for current user
   */
  async getRooms(): Promise<ChatRoom[]> {
    const response = await apiClient.get<ChatRoom[]>('/chats/rooms/');
    return response.data;
  },

  /**
   * Get chat room by ID
   */
  async getRoom(roomId: number): Promise<ChatRoom> {
    const response = await apiClient.get<ChatRoom>(`/chats/rooms/${roomId}/`);
    return response.data;
  },

  /**
   * Get or create chat room with another user
   */
  async getOrCreateRoom(userId: number): Promise<ChatRoom> {
    const response = await apiClient.get<ChatRoom>(`/chats/rooms/user/${userId}/`);
    return response.data;
  },

  /**
   * Create a new chat room
   */
  async createRoom(participantIds: number[]): Promise<ChatRoom> {
    const response = await apiClient.post<ChatRoom>('/chats/rooms/', {
      participant_ids: participantIds,
    });
    return response.data;
  },

  /**
   * Get messages in a chat room
   */
  async getMessages(roomId: number): Promise<Message[]> {
    const response = await apiClient.get<Message[]>(`/chats/rooms/${roomId}/messages/`);
    return response.data;
  },

  /**
   * Send a message
   */
  async sendMessage(roomId: number, content: string): Promise<Message> {
    const response = await apiClient.post<Message>(`/chats/rooms/${roomId}/send/`, {
      content,
    });
    return response.data;
  },

  /**
   * Mark messages as read
   */
  async markAsRead(roomId: number): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/chats/rooms/${roomId}/read/`);
    return response.data;
  },
};

