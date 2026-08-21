export interface UserDTO {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  globalRole: string;
  avatarUrl?: string;
  themePreference?: string;
  locale?: string;
  primaryKitchenId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SignupRequest {
  email: string;
  username?: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email?: string;
  username?: string;
  identifier?: string;
  password: string;
}

export interface AuthResponseDTO {
  user: UserDTO;
  accessToken: string;
  expiresIn: number;
}

export interface RefreshResponseDTO {
  accessToken: string;
  expiresIn: number;
}

export interface UpdateProfileRequest {
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  themePreference?: 'system' | 'light' | 'dark';
  locale?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserSessionDTO {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;
  createdAt: string;
  isCurrent?: boolean;
}
