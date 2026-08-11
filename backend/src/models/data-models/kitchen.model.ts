export interface KitchenDTO {
  id: string;
  name: string;
  description?: string;
  createdBy?: string;
  role: 'owner' | 'editor' | 'viewer';
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface KitchenMemberDTO {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'active' | 'invited';
  joinedAt: string;
}

export interface CreateKitchenRequest {
  name: string;
  description?: string;
}

export interface UpdateKitchenRequest {
  name?: string;
  description?: string;
}

export interface InviteKitchenMemberRequest {
  email: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface UpdateKitchenMemberRoleRequest {
  role: 'owner' | 'editor' | 'viewer';
}
