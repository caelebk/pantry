export interface UserDTO {
  id: string;
  email: string;
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
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
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
