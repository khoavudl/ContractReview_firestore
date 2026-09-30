import type { UserRole } from './statusEnums';

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  createdAt: { seconds: number; nanoseconds: number } | Date;
  updatedAt: { seconds: number; nanoseconds: number } | Date;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  department?: string;
}
