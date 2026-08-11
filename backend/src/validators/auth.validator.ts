import {
  ChangePasswordRequest,
  LoginRequest,
  SignupRequest,
  UpdateProfileRequest,
} from '../models/data-models/auth.model.ts';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignupRequest(body: Partial<SignupRequest>): ValidationResult {
  const errors: string[] = [];

  if (!body.email || typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length === 0) {
    errors.push('Full name is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLoginRequest(body: Partial<LoginRequest>): ValidationResult {
  const errors: string[] = [];

  if (!body.email || typeof body.email !== 'string' || body.email.trim().length === 0) {
    errors.push('Email address is required.');
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length === 0) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdateProfileRequest(
  body: Partial<UpdateProfileRequest>,
): ValidationResult {
  const errors: string[] = [];

  if (
    body.fullName !== undefined &&
    (typeof body.fullName !== 'string' || body.fullName.trim().length === 0)
  ) {
    errors.push('Full name cannot be empty.');
  }

  if (
    body.themePreference !== undefined &&
    !['system', 'light', 'dark'].includes(body.themePreference)
  ) {
    errors.push('Theme preference must be system, light, or dark.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateChangePasswordRequest(
  body: Partial<ChangePasswordRequest>,
): ValidationResult {
  const errors: string[] = [];

  if (!body.currentPassword || typeof body.currentPassword !== 'string') {
    errors.push('Current password is required.');
  }

  if (!body.newPassword || typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
