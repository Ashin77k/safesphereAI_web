import { Emergency, MissingPerson, Notification, LocationHistory, Location } from '../types';

const BACKEND_URL = ((import.meta as any).env.VITE_BACKEND_URL || 'https://safesphere-ai-backend.onrender.com').replace(/\/$/, '');

// Helper to convert backend date strings to standard Date objects
const toDate = (dateStr: string) => {
  try {
    return new Date(dateStr);
  } catch (e) {
    return new Date();
  }
};

export const backendService = {
  async fetchEmergencies(): Promise<Emergency[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/emergencies`);
      if (!response.ok) throw new Error(`Failed to fetch emergencies: ${response.status}`);
      const data = await response.json();
      return data.map((item: any) => ({
        ...item,
        timestamp: toDate(item.timestamp)
      }));
    } catch (error) {
      console.error('Backend Error (Emergencies):', error);
      return [];
    }
  },

  async fetchMissingPersons(): Promise<MissingPerson[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/missing-persons`);
      if (!response.ok) throw new Error(`Failed to fetch missing persons: ${response.status}`);
      const data = await response.json();
      return data.map((item: any) => ({
        ...item,
        timestamp: toDate(item.timestamp)
      }));
    } catch (error) {
      console.error('Backend Error (Missing Persons):', error);
      return [];
    }
  },

  async fetchNotifications(): Promise<Notification[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/notifications`);
      if (!response.ok) throw new Error(`Failed to fetch notifications: ${response.status}`);
      const data = await response.json();
      return data.map((item: any) => ({
        ...item,
        timestamp: toDate(item.timestamp)
      }));
    } catch (error) {
      console.error('Backend Error (Notifications):', error);
      return [];
    }
  },

  async fetchLocationHistory(): Promise<LocationHistory[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/location-history`);
      if (!response.ok) throw new Error(`Failed to fetch location history: ${response.status}`);
      const data = await response.json();
      return data.map((item: any) => ({
        ...item,
        timestamp: toDate(item.timestamp)
      }));
    } catch (error) {
      console.error('Backend Error (Location History):', error);
      return [];
    }
  },

  async updateStatus(type: 'EMERGENCY' | 'MISSING', id: string, status: string): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/status-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, status })
      });
      return response.ok;
    } catch (error) {
      console.error('Backend Error (Update Status):', error);
      return false;
    }
  },

  async addLocationHistory(parentId: string, location: Location): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/location-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId, location, timestamp: new Date().toISOString() })
      });
      return response.ok;
    } catch (error) {
      console.error('Backend Error (Add Location History):', error);
      return false;
    }
  }
};
