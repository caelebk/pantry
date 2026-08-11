export interface User {
  id: string;
  email: string;
  fullName: string;
  globalRole: string;
  avatarUrl?: string;
  themePreference?: 'system' | 'light' | 'dark';
  locale?: string;
  primaryKitchenId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface UserProfileResponse {
  user: User;
  memberships: Kitchen[];
}

export interface Kitchen {
  id: string;
  name: string;
  description?: string;
  createdBy?: string;
  role: 'owner' | 'editor' | 'viewer';
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface KitchenMember {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'active' | 'invited';
  joinedAt: string;
}

export interface UserSession {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;
  createdAt: string;
  isCurrent?: boolean;
}
