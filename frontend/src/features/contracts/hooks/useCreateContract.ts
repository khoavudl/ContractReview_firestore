/**
 * Feature: Contracts Management & Dashboard
 * Hook: useCreateContract — Contract creation submission and validation
 */

import { useState, useCallback } from 'react';
import type { AuthUser } from '@/shared';
import type { CreateContractPayload } from '../types';
import { createContract } from '../services/contractService';

export interface UseCreateContractReturn {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly submitContract: (payload: CreateContractPayload) => Promise<string | null>;
  readonly clearError: () => void;
}

function validatePayload(payload: CreateContractPayload): string | null {
  if (payload.title.trim().length < 5) {
    return 'Tiêu đề hợp đồng phải có ít nhất 5 ký tự.';
  }
  if (!payload.supplier.trim()) {
    return 'Vui lòng nhập tên đối tác / nhà cung cấp.';
  }
  if (!payload.description.trim()) {
    return 'Vui lòng nhập mô tả tóm tắt nội dung hợp đồng.';
  }
  if (!payload.file) {
    return 'Vui lòng đính kèm tệp hợp đồng Word (.docx) phiên bản đầu tiên.';
  }
  if (!payload.file.name.toLowerCase().endsWith('.docx')) {
    return 'Định dạng tệp không hợp lệ. Hệ thống chỉ chấp nhận tệp Word định dạng .docx.';
  }
  if (payload.file.size > 50 * 1024 * 1024) {
    return 'Dung lượng tệp vượt quá giới hạn 50MB cho phép.';
  }
  return null;
}

export function useCreateContract(user: AuthUser | null): UseCreateContractReturn {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const submitContract = useCallback(
    async (payload: CreateContractPayload): Promise<string | null> => {
      if (!user) {
        setError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        return null;
      }

      const validationError = validatePayload(payload);
      if (validationError) {
        setError(validationError);
        return null;
      }

      setIsSubmitting(true);
      setError(null);
      try {
        const contractId = await createContract(user, payload);
        return contractId;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Không thể tạo hồ sơ hợp đồng.';
        setError(msg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user]
  );

  return {
    isSubmitting,
    error,
    submitContract,
    clearError,
  };
}
