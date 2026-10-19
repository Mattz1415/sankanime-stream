'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { Search, X } from 'lucide-react';

interface IsolatedSearchInputProps {
  value?: string;
  onQueryChange: (query: string) => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onEnter?: () => void;
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

function RawIsolatedSearchInput({
  value = '',
  onQueryChange,
  onArrowDown,
  onArrowUp,
  onEnter,
  onClose,
  placeholder = 'Cari judul anime, genre, atau karakter... (Ctrl+K)',
  autoFocus = true,
}: IsolatedSearchInputProps) {
  const [localText, setLocalText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== localText) {
      setLocalText(value);
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setLocalText(nextVal);
    onQueryChange(nextVal);
  };

  const handleClear = () => {
    setLocalText('');
    onQueryChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Android IME composition check
    const isComp = (e.nativeEvent as any)?.isComposing || (e as any).isComposing || e.keyCode === 229;
    if (isComp) {
      return;
    }

    // 2. CRITICAL: Never call preventDefault on Backspace or Delete
    if (e.key === 'Backspace' || e.key === 'Delete' || e.keyCode === 8 || e.keyCode === 46) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      onArrowDown?.();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onArrowUp?.();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onEnter?.();
    }
  };

  return (
    <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center gap-3">
      <Search className="w-5 h-5 text-cyan-400 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={localText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-0 text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none focus:ring-0"
      />
      {localText && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 spring-press"
          title="Hapus pencarian"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 rounded-lg text-xs bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white font-mono"
        >
          ESC
        </button>
      )}
    </div>
  );
}

export const IsolatedSearchInput = memo(RawIsolatedSearchInput);
export default IsolatedSearchInput;
