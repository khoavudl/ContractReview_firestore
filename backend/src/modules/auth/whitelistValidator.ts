import type { UserRole, UserDocument } from '../../types/index.js';

export const VALID_ROLES: readonly UserRole[] = ['USER', 'LEGAL', 'HOL'] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks whether an input value is a valid UserRole.
 */
export function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.includes(role as UserRole);
}

/**
 * Checks whether an input string is a valid email.
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

export interface WhitelistValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a user whitelist record prior to syncing or seeding.
 */
export function validateWhitelistUser(
  user: Partial<UserDocument>
): WhitelistValidationResult {
  const errors: string[] = [];

  if (!user.uid || typeof user.uid !== 'string' || user.uid.trim() === '') {
    errors.push('UID is required and must be a non-empty string.');
  }

  if (!isValidEmail(user.email)) {
    errors.push('Email is invalid or missing.');
  }

  if (!user.displayName || user.displayName.trim() === '') {
    errors.push('Display name is required.');
  }

  if (!isValidRole(user.role)) {
    errors.push(`Role must be one of: ${VALID_ROLES.join(', ')}.`);
  }

  if (typeof user.isActive !== 'boolean') {
    errors.push('isActive must be a boolean flag.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
