import { Timestamp } from './firebase';

export type UserRole = 'ADMIN' | 'USER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Timestamp;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Emergency {
  id: string;
  userId: string;
  userName?: string;
  location: Location;
  status: 'ACTIVE' | 'SAFE';
  timestamp: Timestamp;
  description?: string;
}

export interface MissingPerson {
  id: string;
  name: string;
  lastSeenLocation: Location;
  status: 'MISSING' | 'FOUND';
  timestamp: Timestamp;
  description?: string;
  reportedBy?: string;
}

export interface Notification {
  id: string;
  type: 'EMERGENCY' | 'MISSING' | 'STATUS_UPDATE';
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Timestamp;
  relatedId?: string;
}

export interface LocationHistory {
  id: string;
  parentId: string;
  location: Location;
  timestamp: Timestamp;
}
