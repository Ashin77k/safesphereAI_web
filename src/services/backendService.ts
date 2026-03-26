import { Emergency, MissingPerson, Notification } from '../types';
import { Timestamp } from '../firebase';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'https://safesphere-ai-backend.onrender.com';

// Helper to convert backend date strings to Firestore Timestamps for consistency
const toTimestamp = (dateStr: string) => {
  return Timestamp.fromDate(new Date(dateStr));
};

export const backendService = {
  async fetchEmergencies(): Promise<Emergency[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/emergencies`);
      if (!response.ok) throw new Error('Failed to fetch emergencies');
      const data = await response.json();
      return data.map((item: any) => ({
        ...item,
        timestamp: toTimestamp(item.timestamp)
      }));
    } catch (error) {
      console.error('Backend Error (Emergencies):', error);
      return [];
    }
  },

  async fetchMissingPersons(): Promise<MissingPerson[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/missing-persons`);
      if (!response.ok) throw new Error('Failed to fetch missing persons');
      const data = await response.json();
      return data.map((item: any) => ({
        ...item,
        timestamp: toTimestamp(item.timestamp)
      }));
    } catch (error) {
      console.error('Backend Error (Missing Persons):', error);
      return [];
    }
  },

  async fetchNotifications(): Promise<Notification[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      return data.map((item: any) => ({
        ...item,
        timestamp: toTimestamp(item.timestamp)
      }));
    } catch (error) {
      console.error('Backend Error (Notifications):', error);
      return [];
    }
  },

  async updateStatus(type: 'EMERGENCY' | 'MISSING', id: string, status: string): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/status-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, status })
      });
      return response.ok;
    } catch (error) {
      console.error('Backend Error (Update Status):', error);
      return false;
    }
  }
};
