export interface UserAudit {
  id: string;
  username?: string;
  fullName?: string;
}

export interface AuditFields {
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: UserAudit;
  updatedBy?: UserAudit;
}
