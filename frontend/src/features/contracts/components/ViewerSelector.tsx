/**
 * Feature: Contracts Management & Dashboard
 * Component: ViewerSelector — Autocomplete & Chip Selection for Shared Contract Viewers
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserCheck, X, Search, Building } from 'lucide-react';
import { fetchActiveUsers, type ActiveUserOption } from '../services/contractService';

export interface ViewerSelectorProps {
  readonly selectedEmails: readonly string[];
  readonly onChange: (emails: string[]) => void;
  readonly creatorEmail?: string;
  readonly disabled?: boolean;
  readonly placeholder?: string;
}

export function ViewerSelector({
  selectedEmails,
  onChange,
  creatorEmail,
  disabled = false,
  placeholder = 'Tìm tên, email hoặc phòng ban để thêm người xem...',
}: ViewerSelectorProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<readonly ActiveUserOption[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    fetchActiveUsers().then((data) => {
      if (mounted) setUsers(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedCreator = (creatorEmail || '').trim().toLowerCase();
  const selectedSet = useMemo(
    () => new Set(selectedEmails.map((e) => e.trim().toLowerCase())),
    [selectedEmails]
  );

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const email = u.email.toLowerCase();
      if (email === normalizedCreator || selectedSet.has(email)) return false;
      if (!q) return true;
      const name = u.displayName.toLowerCase();
      const dept = (u.department || '').toLowerCase();
      return email.includes(q) || name.includes(q) || dept.includes(q);
    });
  }, [users, query, normalizedCreator, selectedSet]);

  const handleSelect = (email: string): void => {
    const clean = email.trim().toLowerCase();
    if (!selectedSet.has(clean)) {
      onChange([...selectedEmails, clean]);
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleRemove = (emailToRemove: string): void => {
    const clean = emailToRemove.trim().toLowerCase();
    onChange(selectedEmails.filter((e) => e.trim().toLowerCase() !== clean));
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        Người xem chia sẻ (Viewers)
      </label>

      {/* Selected Chips */}
      {selectedEmails.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          {selectedEmails.map((email) => {
            const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
            const label = matched ? `${matched.displayName} (${matched.email})` : email;
            return (
              <span
                key={email}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
              >
                <UserCheck className="w-3 h-3 text-blue-500" />
                <span className="truncate max-w-[220px]">{label}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(email)}
                    className="p-0.5 hover:bg-blue-200/60 dark:hover:bg-blue-900/60 rounded text-blue-600 dark:text-blue-400"
                    title="Xóa người xem này"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Autocomplete Search Input */}
      {!disabled && (
        <div className="relative">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {isOpen && filteredUsers.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 shadow-lg py-1">
              {filteredUsers.map((u) => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => handleSelect(u.email)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {u.displayName}
                    </span>
                    <span className="ml-1.5 text-slate-400 dark:text-slate-500">
                      &lt;{u.email}&gt;
                    </span>
                  </div>
                  {u.department && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 ml-2 flex-shrink-0">
                      <Building className="w-3 h-3" />
                      {u.department}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
