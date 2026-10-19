'use client';

import React, { useState, memo } from 'react';
import { Send } from 'lucide-react';

interface IsolatedChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  theme?: 'pink' | 'white';
}

function RawIsolatedChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ketik pesan...',
  theme = 'pink',
}: IsolatedChatInputProps) {
  const [localText, setLocalText] = useState('');

  const handleTriggerSend = () => {
    const trimmed = localText.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setLocalText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Android IME composition check (keyCode 229 or isComposing)
    const isComp = (e.nativeEvent as any)?.isComposing || (e as any).isComposing || e.keyCode === 229;
    if (isComp) {
      return;
    }

    // 2. CRITICAL: Never call e.preventDefault() on Backspace or Delete
    if (e.key === 'Backspace' || e.key === 'Delete' || e.keyCode === 8 || e.keyCode === 46) {
      return;
    }

    // 3. Handle Enter key for sending
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTriggerSend();
    }
  };

  const isPink = theme === 'pink';

  return (
    <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#08080c]/95 border border-white/[0.08] shadow-lg">
      <input
        type="text"
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none"
      />

      <button
        type="button"
        onClick={handleTriggerSend}
        disabled={!localText.trim() || disabled}
        className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 spring-press transition-opacity shadow-md shrink-0 ${
          isPink
            ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:brightness-110 disabled:opacity-40 text-white'
            : 'bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white'
        }`}
      >
        <span>Kirim</span>
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export const IsolatedChatInput = memo(RawIsolatedChatInput);
export default IsolatedChatInput;
