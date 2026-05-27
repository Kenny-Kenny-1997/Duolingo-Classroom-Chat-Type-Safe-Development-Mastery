// ============================================================
// DUOLINGO CLASSROOM CHAT — Generic Message Components
// Advanced TypeScript generics for reusable chat UI
// ============================================================

import React from "react";
import type {
  ChatMessage,
  TextMessage,
  AchievementMessage,
  SystemMessage,
  ExerciseMessage,
  ExtractMessage,
  UserRole,
} from "@/types";

// ─── Role Badge ──────────────────────────────────────────────

const ROLE_STYLES: Record<UserRole, { label: string; className: string }> = {
  student: { label: "Student", className: "bg-blue-100 text-blue-700" },
  teacher: { label: "Teacher", className: "bg-green-100 text-green-700" },
  moderator: { label: "Mod", className: "bg-yellow-100 text-yellow-700" },
  admin: { label: "Admin", className: "bg-red-100 text-red-700" },
};

function RoleBadge({ role }: { role: UserRole }): React.ReactElement {
  const { label, className } = ROLE_STYLES[role];
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  );
}

// ─── Message Status Indicator ────────────────────────────────

const STATUS_ICONS: Record<ChatMessage["status"], string> = {
  pending: "⏳",
  sent: "✓",
  delivered: "✓✓",
  flagged: "⚠️",
  removed: "🚫",
};

// ─── Generic Message Wrapper ─────────────────────────────────
// Generic component that works for any message type

interface MessageWrapperProps<T extends ChatMessage> {
  message: T;
  isOwn?: boolean;
  children: React.ReactNode;
}

function MessageWrapper<T extends ChatMessage>({
  message,
  isOwn = false,
  children,
}: MessageWrapperProps<T>): React.ReactElement {
  const timeString = `${message.timestamp.getHours().toString().padStart(2, "0")}:${message.timestamp.getMinutes().toString().padStart(2, "0")}`;

  return (
    <div
      className={`flex gap-3 animate-slide-up ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-duolingo-green flex items-center justify-center text-white font-bold text-sm shrink-0">
        {message.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.author.avatarUrl}
            alt={message.author.displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          message.author.displayName[0]?.toUpperCase() ?? "?"
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1 max-w-xs ${isOwn ? "items-end" : "items-start"}`}>
        {/* Author info */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">
            {message.author.displayName}
          </span>
          <RoleBadge role={message.author.role} />
          <span className="text-xs text-gray-400">{timeString}</span>
          <span className="text-xs">{STATUS_ICONS[message.status]}</span>
        </div>

        {/* Message content */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-duolingo-green text-white rounded-tr-sm"
              : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Text Message Component ──────────────────────────────────

interface TextMessageProps {
  message: ExtractMessage<"text">;
  isOwn?: boolean;
}

export function TextMessageComponent({
  message,
  isOwn = false,
}: TextMessageProps): React.ReactElement {
  if (message.status === "removed") {
    return (
      <MessageWrapper message={message} isOwn={isOwn}>
        <span className="italic text-sm opacity-60">
          This message was removed by a moderator
        </span>
      </MessageWrapper>
    );
  }

  if (message.status === "flagged") {
    return (
      <MessageWrapper message={message} isOwn={isOwn}>
        <div className="space-y-1">
          <p className="text-sm">{message.content}</p>
          <p className="text-xs text-yellow-600 font-medium">
            ⚠️ Under review by moderation
          </p>
        </div>
      </MessageWrapper>
    );
  }

  return (
    <MessageWrapper message={message} isOwn={isOwn}>
      <p className="text-sm leading-relaxed">{message.content}</p>
    </MessageWrapper>
  );
}

// ─── Achievement Message Component ───────────────────────────

interface AchievementMessageProps {
  message: ExtractMessage<"achievement">;
}

export function AchievementMessageComponent({
  message,
}: AchievementMessageProps): React.ReactElement {
  return (
    <div className="flex justify-center my-3 animate-bounce-in">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-2xl px-6 py-3 shadow-duolingo text-center">
        <div className="text-2xl mb-1">🏆</div>
        <p className="font-bold text-sm">{message.author.displayName} earned</p>
        <p className="font-bold">{message.achievementName}</p>
        <p className="text-xs opacity-90">+{message.xpEarned} XP</p>
      </div>
    </div>
  );
}

// ─── System Message Component ────────────────────────────────

export function SystemMessageComponent({
  message,
}: {
  message: ExtractMessage<"system">;
}): React.ReactElement {
  return (
    <div className="flex justify-center my-2">
      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
        {message.systemContent}
      </span>
    </div>
  );
}

// ─── Exercise Message Component ──────────────────────────────

export function ExerciseMessageComponent({
  message,
  isOwn = false,
}: {
  message: ExtractMessage<"exercise">;
  isOwn?: boolean;
}): React.ReactElement {
  return (
    <MessageWrapper message={message} isOwn={isOwn}>
      <div className="space-y-2">
        <p className="text-xs font-bold opacity-80 uppercase tracking-wide">
          📝 Exercise
        </p>
        <p className="text-sm font-medium">{message.prompt}</p>
        {message.answer !== undefined && (
          <div
            className={`text-sm font-bold ${
              message.isCorrect === true
                ? "text-green-400"
                : message.isCorrect === false
                ? "text-red-400"
                : "text-gray-600"
            }`}
          >
            Answer: {message.answer}{" "}
            {message.isCorrect === true ? "✓" : message.isCorrect === false ? "✗" : ""}
          </div>
        )}
      </div>
    </MessageWrapper>
  );
}

// ─── Polymorphic Message Renderer ────────────────────────────
// Uses TypeScript discriminated union to render the correct component

interface MessageRendererProps {
  message: ChatMessage;
  currentUserId?: string;
}

export function MessageRenderer({
  message,
  currentUserId,
}: MessageRendererProps): React.ReactElement {
  const isOwn = message.authorId === currentUserId;

  switch (message.type) {
    case "text":
      return <TextMessageComponent message={message} isOwn={isOwn} />;
    case "achievement":
      return <AchievementMessageComponent message={message} />;
    case "system":
      return <SystemMessageComponent message={message} />;
    case "exercise":
      return <ExerciseMessageComponent message={message} isOwn={isOwn} />;
    case "translation":
      return (
        <MessageWrapper message={message} isOwn={isOwn}>
          <div className="space-y-1">
            <p className="text-xs opacity-70">Original ({message.originalLanguage}):</p>
            <p className="text-sm italic opacity-80">{message.originalContent}</p>
            <p className="text-xs opacity-70 mt-1">
              Translation ({message.targetLanguage}):
            </p>
            <p className="text-sm font-medium">{message.translatedContent}</p>
          </div>
        </MessageWrapper>
      );
    default: {
      // TypeScript exhaustive check — will error if a new type is added but not handled
      const _exhaustive: never = message;
      return _exhaustive;
    }
  }
}
