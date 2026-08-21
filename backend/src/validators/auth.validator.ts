import {
  ChangePasswordRequest,
  LoginRequest,
  ResendVerificationRequest,
  SignupRequest,
  UpdateProfileRequest,
  VerifyEmailRequest,
} from '../models/data-models/auth.model.ts';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'admin123',
  'admin1234',
  'qwerty123',
  'pantry123',
  'welcome123',
  'secret123',
  'letmein123',
  'iloveyou',
  'pass1234',
]);

/**
 * Validates password strength:
 * - 8 to 128 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 * - Not in common passwords list
 * - Does not contain email username or username
 */
export function validatePasswordStrength(
  password: string,
  usernameOrEmail?: string,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }

  const lowerPassword = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(lowerPassword)) {
    errors.push(
      'This password is too common and easily guessed. Please choose a stronger password.',
    );
  }

  if (usernameOrEmail && typeof usernameOrEmail === 'string') {
    const handle = usernameOrEmail.split('@')[0].trim().toLowerCase();
    if (handle.length >= 3 && lowerPassword.includes(handle)) {
      errors.push('Password cannot contain your username or email prefix.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateSignupRequest(body: Partial<SignupRequest>): ValidationResult {
  const errors: string[] = [];

  if (!body.email || typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (body.username !== undefined) {
    if (typeof body.username !== 'string' || !USERNAME_REGEX.test(body.username.trim())) {
      errors.push(
        'Username must be 3-30 characters long and contain only letters, numbers, and underscores.',
      );
    }
  }

  const pwValidation = validatePasswordStrength(
    body.password || '',
    body.username || body.email,
  );
  if (!pwValidation.isValid) {
    errors.push(...pwValidation.errors);
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
  const identifier = body.identifier || body.email || body.username;

  if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
    errors.push('Email address or username is required.');
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length === 0) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateVerifyEmailRequest(body: Partial<VerifyEmailRequest>): ValidationResult {
  const errors: string[] = [];

  if (!body.token || typeof body.token !== 'string' || body.token.trim().length === 0) {
    errors.push('Verification token is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateResendVerificationRequest(
  body: Partial<ResendVerificationRequest>,
): ValidationResult {
  const errors: string[] = [];

  if (!body.email || typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    errors.push('Please provide a valid email address.');
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

  if (body.username !== undefined) {
    if (typeof body.username !== 'string' || !USERNAME_REGEX.test(body.username.trim())) {
      errors.push(
        'Username must be 3-30 characters long and contain only letters, numbers, and underscores.',
      );
    }
  }

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

  const pwValidation = validatePasswordStrength(body.newPassword || '');
  if (!pwValidation.isValid) {
    errors.push(...pwValidation.errors);
  }

  if (body.currentPassword && body.newPassword && body.currentPassword === body.newPassword) {
    errors.push('New password must be different from your current password.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
