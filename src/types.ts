export type UserRole = 'ADMIN' | 'USER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
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
  timestamp: Date;
  description?: string;
}

export interface MissingPerson {
  id: string;
  name: string;
  lastSeenLocation: Location;
  status: 'MISSING' | 'FOUND';
  timestamp: Date;
  description?: string;
  reportedBy?: string;
}

export interface Notification {
  id: string;
  type: 'EMERGENCY' | 'MISSING' | 'STATUS_UPDATE';
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
  relatedId?: string;
}

export interface LocationHistory {
  id: string;
  parentId: string;
  location: Location;
  timestamp: Date;
}
