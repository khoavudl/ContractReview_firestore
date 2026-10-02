import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UploadRefDropzone } from './UploadRefDropzone';

describe('UploadRefDropzone Component', () => {
  it('renders dropzone with multiple attribute and 5MB limit hint', () => {
    const onUpload = vi.fn();
    const onUploadFiles = vi.fn();

    const { container } = render(
      <UploadRefDropzone
        isUploading={false}
        uploadProgress={null}
        onUpload={onUpload}
        onUploadFiles={onUploadFiles}
      />
    );

    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('multiple');
    expect(screen.getByText(/Tối đa 10 tệp\/hồ sơ \(≤ 5MB\/tệp\)/)).toBeInTheDocument();
  });

  it('allows picking multiple files and calls onUploadFiles', async () => {
    const onUploadFiles = vi.fn().mockResolvedValue(true);
    const { container } = render(
      <UploadRefDropzone
        isUploading={false}
        uploadProgress={null}
        currentFileCount={2}
        onUpload={vi.fn()}
        onUploadFiles={onUploadFiles}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();

    const file1 = new File(['aaa'], 'doc1.pdf', { type: 'application/pdf' });
    const file2 = new File(['bbb'], 'doc2.pdf', { type: 'application/pdf' });

    fireEvent.change(input, {
      target: { files: [file1, file2] },
    });

    await waitFor(() => {
      expect(onUploadFiles).toHaveBeenCalledWith([file1, file2]);
    });
  });

  it('blocks files when any file exceeds 5MB limit', async () => {
    const onUploadFiles = vi.fn();
    const { container } = render(
      <UploadRefDropzone
        isUploading={false}
        uploadProgress={null}
        currentFileCount={0}
        onUpload={vi.fn()}
        onUploadFiles={onUploadFiles}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const oversizedFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'giant.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, {
      target: { files: [oversizedFile] },
    });

    await waitFor(() => {
      expect(screen.getByText(/vượt quá dung lượng tối đa 5MB/)).toBeInTheDocument();
    });
    expect(onUploadFiles).not.toHaveBeenCalled();
  });

  it('blocks files when total count would exceed max limit (10 files)', async () => {
    const onUploadFiles = vi.fn();
    const { container } = render(
      <UploadRefDropzone
        isUploading={false}
        uploadProgress={null}
        currentFileCount={8}
        maxFiles={10}
        onUpload={vi.fn()}
        onUploadFiles={onUploadFiles}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const f1 = new File(['1'], '1.pdf', { type: 'application/pdf' });
    const f2 = new File(['2'], '2.pdf', { type: 'application/pdf' });
    const f3 = new File(['3'], '3.pdf', { type: 'application/pdf' });

    // 8 existing + 3 new = 11 > 10
    fireEvent.change(input, {
      target: { files: [f1, f2, f3] },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Hồ sơ đã có 8\/10 tệp. Bạn chỉ có thể tải thêm tối đa 2 tệp nữa./)
      ).toBeInTheDocument();
    });
    expect(onUploadFiles).not.toHaveBeenCalled();
  });

  it('disables input and displays notice when already at 10 files limit', () => {
    const { container } = render(
      <UploadRefDropzone
        isUploading={false}
        uploadProgress={null}
        currentFileCount={10}
        maxFiles={10}
        onUpload={vi.fn()}
      />
    );

    expect(screen.getByText('Đã đạt giới hạn tối đa 10 tệp đính kèm')).toBeInTheDocument();
    expect(screen.getByText('Xóa bớt tệp nếu muốn đính kèm thêm tài liệu mới')).toBeInTheDocument();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});
