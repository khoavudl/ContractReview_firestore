import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AISummaryBox } from './AISummaryBox';
import type { SummaryResult } from '../types';

describe('AISummaryBox Component', () => {
  const mockData: SummaryResult = {
    contractType: 'Hợp đồng Dịch vụ Truyền thông',
    duration: '12 tháng (15/10/2026 - 15/10/2027)',
    parties: {
      partyA: 'Công ty Cổ phần VinFast',
      partyB: 'Agency Truyền thông Sáng tạo ABC',
    },
    financialTerms:
      '• Tổng ngân sách: 4.862.721.600 VNĐ (đã bao gồm 8% VAT)\n• Phương thức thanh toán: Chuyển khoản qua 3 đợt\n  - Đợt 1 (30%): 1.458.816.480 VNĐ trong 7 ngày sau khi ký\n  - Đợt 2 (30%): 1.458.816.480 VNĐ trong 30 ngày\n  - Đợt 3 (còn lại): theo nghiệm thu thực tế',
    keyObligations: [
      'Bên B cung cấp dịch vụ sản xuất TVC đúng deadline',
      'Bên A duyệt kịch bản trong vòng 3 ngày làm việc',
    ],
    terminationConditions: [
      'Được quyền đơn phương chấm dứt khi vi phạm quá 15 ngày làm việc',
    ],
    specialClauses: ['Cam kết bảo mật thông tin (NDA)', 'Phạt vi phạm tối đa 8%'],
  };

  it('renders contract type and duration in top balanced grid', () => {
    render(<AISummaryBox data={mockData} />);

    expect(screen.getByText('Loại hình giao dịch')).toBeInTheDocument();
    expect(screen.getByText('Hợp đồng Dịch vụ Truyền thông')).toBeInTheDocument();
    expect(screen.getByText('Thời hạn thực hiện')).toBeInTheDocument();
    expect(screen.getByText('12 tháng (15/10/2026 - 15/10/2027)')).toBeInTheDocument();
  });

  it('renders contracting parties', () => {
    render(<AISummaryBox data={mockData} />);

    expect(screen.getByText('Bên A (Khách hàng)')).toBeInTheDocument();
    expect(screen.getByText('Công ty Cổ phần VinFast')).toBeInTheDocument();
    expect(screen.getByText('Bên B (Nhà cung cấp/Đối tác)')).toBeInTheDocument();
    expect(screen.getByText('Agency Truyền thông Sáng tạo ABC')).toBeInTheDocument();
  });

  it('renders full-width financial terms card with whitespace-pre-line formatting', () => {
    render(<AISummaryBox data={mockData} />);

    const titleEl = screen.getByText('Giá trị & Tiến độ thanh toán');
    expect(titleEl).toBeInTheDocument();

    const termsEl = screen.getByText(/Tổng ngân sách: 4\.862\.721\.600 VNĐ/);
    expect(termsEl).toBeInTheDocument();
    expect(termsEl).toHaveClass('whitespace-pre-line');
  });

  it('renders key obligations, termination conditions, and special clauses', () => {
    render(<AISummaryBox data={mockData} />);

    expect(screen.getByText(/Nghĩa vụ cốt lõi/)).toBeInTheDocument();
    expect(screen.getByText('Bên B cung cấp dịch vụ sản xuất TVC đúng deadline')).toBeInTheDocument();
    expect(screen.getByText('Điều kiện chấm dứt hợp đồng')).toBeInTheDocument();
    expect(screen.getByText(/Cam kết bảo mật thông tin/)).toBeInTheDocument();
  });
});
