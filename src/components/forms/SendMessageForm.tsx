"use client";

import { useState } from "react";
import type { ChatMessageInput } from "@/lib/validation/schemas";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/types";

interface SendMessageFormProps {
  courseId: string;
  defaultLanguage?: SupportedLanguage;
  onSend: (data: ChatMessageInput) => void;
  disabled?: boolean;
}

export function SendMessageForm({
  courseId,
  defaultLanguage = "en",
  onSend,
  disabled = false,
}: SendMessageFormProps): React.ReactElement {
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>(defaultLanguage);

  const handleSend = (): void => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend({ content: trimmed, language, courseId });
    setContent("");
  };

  return (
    <div className="border-t border-gray-100 bg-white p-4 flex gap-3 items-end">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
        className="border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50"
      >
        {(
          Object.entries(SUPPORTED_LANGUAGES) as [SupportedLanguage, string][]
        ).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message..."
        rows={2}
        disabled={disabled}
        className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !content.trim()}
        className="bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-3 px-5 rounded-2xl"
      >
        Send
      </button>
    </div>
  );
}
