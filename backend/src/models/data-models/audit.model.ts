/**
 * Audit Data Models
 */

export interface UserAuditDTO {
  id: string;
  username?: string;
  fullName?: string;
}

export interface AuditFieldsDTO {
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: UserAuditDTO;
  updatedBy?: UserAuditDTO;
}
