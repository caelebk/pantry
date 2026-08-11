import {
  CreateKitchenRequest,
  InviteKitchenMemberRequest,
  UpdateKitchenRequest,
} from '../models/data-models/kitchen.model.ts';
import { ValidationResult } from './auth.validator.ts';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCreateKitchenRequest(
  body: Partial<CreateKitchenRequest>,
): ValidationResult {
  const errors: string[] = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('Kitchen name is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdateKitchenRequest(
  body: Partial<UpdateKitchenRequest>,
): ValidationResult {
  const errors: string[] = [];

  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
    errors.push('Kitchen name cannot be empty.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateInviteKitchenMemberRequest(
  body: Partial<InviteKitchenMemberRequest>,
): ValidationResult {
  const errors: string[] = [];

  if (!body.email || typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!body.role || !['owner', 'editor', 'viewer'].includes(body.role)) {
    errors.push('Member role must be owner, editor, or viewer.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
