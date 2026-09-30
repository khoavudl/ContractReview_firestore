import { describe, it, expect } from 'vitest';
import {
  isValidRole,
  isValidEmail,
  validateWhitelistUser,
} from './whitelistValidator.js';

describe('whitelistValidator', () => {
  describe('isValidRole', () => {
    it('accepts valid roles: USER, LEGAL, HOL', () => {
      expect(isValidRole('USER')).toBe(true);
      expect(isValidRole('LEGAL')).toBe(true);
      expect(isValidRole('HOL')).toBe(true);
    });

    it('rejects invalid roles', () => {
      expect(isValidRole('ADMIN')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
      expect(isValidRole(123)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('accepts standard corporate emails', () => {
      expect(isValidEmail('tindn@foodempire.vn')).toBe(true);
      expect(isValidEmail('legal.dept@company.com.vn')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('plainaddress')).toBe(false);
      expect(isValidEmail('@missingusername.com')).toBe(false);
      expect(isValidEmail('username@.com')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });
  });

  describe('validateWhitelistUser', () => {
    it('passes for a valid user object', () => {
      const result = validateWhitelistUser({
        uid: 'user-001',
        email: 'tester@foodempire.vn',
        displayName: 'Doan Ngoc Tin',
        role: 'USER',
        isActive: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when required fields are missing', () => {
      const result = validateWhitelistUser({
        email: 'invalid-email',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('UID is required and must be a non-empty string.');
      expect(result.errors).toContain('Email is invalid or missing.');
      expect(result.errors).toContain('Display name is required.');
      expect(result.errors).toContain('Role must be one of: USER, LEGAL, HOL.');
      expect(result.errors).toContain('isActive must be a boolean flag.');
    });
  });
});
