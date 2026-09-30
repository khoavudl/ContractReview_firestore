/**
 * Formats contract ID according to project specification: CTR-YYMM-XXXX
 */
export function formatContractId(yearMonth: string, sequence: number): string {
  const paddedSeq = String(sequence).padStart(4, '0');
  const cleanYm = yearMonth.replace(/[^0-9]/g, '').slice(0, 4);
  return `CTR-${cleanYm}-${paddedSeq}`;
}

/**
 * Truncates a string to a specified length and appends ellipsis.
 */
export function truncateText(text: string, maxLength = 50): string {
  if (!text || text.length <= maxLength) return text ?? '';
  return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Formats byte size into human readable string (Bytes, KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = (bytes / Math.pow(k, i)).toFixed(1);

  return `${value} ${sizes[i]}`;
}
