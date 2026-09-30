/**
 * Feature: Auth & Whitelist Check
 * Component: LoginCard — Enterprise SSO Login Card with Microsoft & Google
 */

import React, { useState } from 'react';
import { FileCheck, AlertCircle, X, Lock, UserCheck, ShieldOff } from 'lucide-react';
import { Button } from '@/shared';
import { useAuth } from '../hooks/useAuth';
import type { SignInProvider, BlockedUserInfo } from '../types';
import { WhitelistBlockModal } from './WhitelistBlockModal';

export interface LoginCardProps {
  readonly onSuccess?: () => void;
}

const DEV_USERS = {
  USER: {
    uid: 'user_sales_01',
    email: 'user.sales@foodempire.vn',
    displayName: 'Nguyễn Văn Phụ Trách',
    role: 'USER' as const,
    department: 'Sales Department',
    isActive: true,
  },
  LEGAL: {
    uid: 'legal_specialist_01',
    email: 'legal.specialist@foodempire.vn',
    displayName: 'Trần Thị Pháp Chế',
    role: 'LEGAL' as const,
    department: 'Legal Department',
    isActive: true,
  },
  HOL: {
    uid: 'head_of_legal_01',
    email: 'head.legal@foodempire.vn',
    displayName: 'Lê Văn Trưởng Phòng',
    role: 'HOL' as const,
    department: 'Legal Department',
    isActive: true,
  },
};

function MicrosoftIcon(): React.ReactElement {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

function GoogleIcon(): React.ReactElement {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function LoginCard({ onSuccess }: LoginCardProps): React.ReactElement {
  const {
    signIn,
    login,
    isLoggingIn,
    error,
    blockedUser,
    clearError,
    clearBlockedUser,
  } = useAuth();
  const [activeProvider, setActiveProvider] = useState<SignInProvider | null>(null);
  const [devBlocked, setDevBlocked] = useState<BlockedUserInfo | null>(null);

  const handleSignIn = async (provider: SignInProvider) => {
    setActiveProvider(provider);
    const success = await signIn(provider);
    if (success) {
      onSuccess?.();
    }
  };

  const handleDevLogin = (role: 'USER' | 'LEGAL' | 'HOL') => {
    login(DEV_USERS[role]);
    onSuccess?.();
  };

  const activeBlockedUser = blockedUser || devBlocked;

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl transition-all">
      <div className="flex flex-col items-center text-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
          <FileCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Contract Review v2.0
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cổng rà soát hợp đồng tập trung • Đăng nhập SSO
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{error.message}</div>
          <button
            type="button"
            onClick={clearError}
            className="text-rose-400 hover:text-rose-600 transition-colors"
            aria-label="Đóng thông báo lỗi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-3">
        <Button
          variant="outline"
          fullWidth
          size="lg"
          disabled={isLoggingIn}
          isLoading={isLoggingIn && activeProvider === 'microsoft'}
          icon={<MicrosoftIcon />}
          onClick={() => handleSignIn('microsoft')}
          className="justify-center border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium h-12"
        >
          Đăng nhập với Microsoft 365
        </Button>

        <Button
          variant="outline"
          fullWidth
          size="lg"
          disabled={isLoggingIn}
          isLoading={isLoggingIn && activeProvider === 'google'}
          icon={<GoogleIcon />}
          onClick={() => handleSignIn('google')}
          className="justify-center border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium h-12"
        >
          Đăng nhập với Google
        </Button>
      </div>

      {import.meta.env.DEV && (
        <div className="mt-6 pt-5 border-t border-dashed border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
            <UserCheck className="w-3.5 h-3.5 text-brand-500" />
            <span>Chế độ thử nghiệm nhanh (Local Dev)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDevLogin('USER')}
              className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-brand-950/40 text-slate-700 dark:text-slate-300 transition-colors"
            >
              👤 USER
            </button>
            <button
              type="button"
              onClick={() => handleDevLogin('LEGAL')}
              className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-brand-950/40 text-slate-700 dark:text-slate-300 transition-colors"
            >
              ⚖️ LEGAL
            </button>
            <button
              type="button"
              onClick={() => handleDevLogin('HOL')}
              className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-brand-950/40 text-slate-700 dark:text-slate-300 transition-colors"
            >
              👔 HOL
            </button>
          </div>
          <button
            type="button"
            onClick={() => setDevBlocked({ email: 'stranger@gmail.com', reason: 'NOT_WHITELISTED' })}
            className="w-full mt-2 py-1.5 px-2 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 transition-colors flex items-center justify-center gap-1.5"
          >
            <ShieldOff className="w-3 h-3 text-rose-500" />
            <span>Thử nghiệm Chặn Whitelist (Modal)</span>
          </button>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Lock className="w-3.5 h-3.5" />
        <span>Chỉ áp dụng cho tài khoản đã được cấp quyền Whitelist</span>
      </div>

      <WhitelistBlockModal
        isOpen={activeBlockedUser !== null}
        blockedUser={activeBlockedUser}
        onClose={() => {
          clearBlockedUser();
          setDevBlocked(null);
        }}
        onSwitchAccount={() => {
          clearBlockedUser();
          setDevBlocked(null);
        }}
      />
    </div>
  );
}
