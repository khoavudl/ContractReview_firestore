/**
 * Unit Tests for WhitelistBlockModal
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhitelistBlockModal } from './WhitelistBlockModal';
import type { BlockedUserInfo } from '../types';

describe('WhitelistBlockModal', () => {
  it('renders nothing when blockedUser is null', () => {
    const { container } = render(
      <WhitelistBlockModal
        isOpen={true}
        blockedUser={null}
        onClose={vi.fn()}
        onSwitchAccount={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly for NOT_WHITELISTED reason', () => {
    const blockedUser: BlockedUserInfo = {
      email: 'outsider@gmail.com',
      reason: 'NOT_WHITELISTED',
    };

    render(
      <WhitelistBlockModal
        isOpen={true}
        blockedUser={blockedUser}
        onClose={vi.fn()}
        onSwitchAccount={vi.fn()}
      />
    );

    expect(screen.getByText('Tài khoản chưa được cấp quyền')).toBeInTheDocument();
    expect(screen.getByText('outsider@gmail.com')).toBeInTheDocument();
    expect(
      screen.getByText(/chưa nằm trong danh sách nhân sự được cấp quyền/)
    ).toBeInTheDocument();
  });

  it('renders correctly for INACTIVE reason', () => {
    const blockedUser: BlockedUserInfo = {
      email: 'former_staff@foodempire.vn',
      reason: 'INACTIVE',
    };

    render(
      <WhitelistBlockModal
        isOpen={true}
        blockedUser={blockedUser}
        onClose={vi.fn()}
        onSwitchAccount={vi.fn()}
      />
    );

    expect(screen.getByText('Tài khoản đã bị tạm khóa')).toBeInTheDocument();
    expect(screen.getByText('former_staff@foodempire.vn')).toBeInTheDocument();
    expect(
      screen.getByText(/trạng thái ngừng kích hoạt trong hệ thống/)
    ).toBeInTheDocument();
  });

  it('triggers onSwitchAccount when clicking switch button', () => {
    const onSwitchAccount = vi.fn();
    const blockedUser: BlockedUserInfo = {
      email: 'test@example.com',
      reason: 'NOT_WHITELISTED',
    };

    render(
      <WhitelistBlockModal
        isOpen={true}
        blockedUser={blockedUser}
        onClose={vi.fn()}
        onSwitchAccount={onSwitchAccount}
      />
    );

    const switchBtn = screen.getByText('Đăng nhập tài khoản khác');
    fireEvent.click(switchBtn);
    expect(onSwitchAccount).toHaveBeenCalledTimes(1);
  });
});
