// ============================================================
// DUOLINGO CLASSROOM CHAT — Chat Room Component
// Full classroom chat UI with type-safe messaging
// ============================================================

"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { MessageRenderer } from "@/components/chat/MessageComponents";
import { SendMessageForm } from "@/components/forms/SendMessageForm";
import { ChatErrorBoundary, ErrorAlert } from "@/components/ui/ErrorBoundary";
import { useMessages, useApiError } from "@/lib/hooks";
import type { ChatMessage, Course, SupportedLanguage, User } from "@/types";
import type { ChatMessageInput } from "@/lib/validation/schemas";

// ─── Mock Data ───────────────────────────────────────────────

const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    authorId: "teacher-1",
    author: { id: "teacher-1", displayName: "Señora García", role: "teacher" },
    timestamp: new Date("2024-01-01T10:00:00"),
    status: "delivered",
    type: "text",
    language: "es",
    courseId: "course-123",
    content: "¡Buenos días a todos! Today we'll practice greetings in Spanish.",
  },
  {
    id: "2",
    authorId: "student-1",
    author: { id: "student-1", displayName: "Alex K.", role: "student" },
    timestamp: new Date("2024-01-01T10:01:00"),
    status: "delivered",
    type: "text",
    language: "es",
    courseId: "course-123",
    content: "¡Hola! Buenos días, Señora García.",
  },
  {
    id: "sys-1",
    authorId: "system",
    author: { id: "system", displayName: "System", role: "moderator" },
    timestamp: new Date("2024-01-01T10:02:00"),
    status: "delivered",
    type: "system",
    language: "en",
    courseId: "course-123",
    systemContent: "Alex K. earned 10 XP for correct Spanish greeting!",
  },
  {
    id: "3",
    authorId: "teacher-1",
    author: { id: "teacher-1", displayName: "Señora García", role: "teacher" },
    timestamp: new Date("2024-01-01T10:03:00"),
    status: "delivered",
    type: "exercise",
    language: "es",
    courseId: "course-123",
    exerciseId: "ex-1",
    prompt: "How do you say 'Good afternoon' in Spanish?",
    answer: "Buenas tardes",
    isCorrect: true,
  },
];

const DEMO_COURSE: Course = {
  id: "course-123",
  name: "Spanish for Beginners (A1)",
  language: "es",
  level: "A1",
  teacherId: "teacher-1",
  studentIds: ["student-1", "student-2"],
  maxStudents: 20,
  isActive: true,
  createdAt: new Date("2024-01-01"),
};

const DEMO_USER: User = {
  id: "student-1",
  username: "alex_k",
  displayName: "Alex K.",
  role: "student",
  learningLanguage: "es",
  nativeLanguage: "en",
  xp: 250,
  streak: 7,
  createdAt: new Date("2024-01-01"),
};

// ─── Participant Badge ───────────────────────────────────────

function ParticipantBadge({ user }: { user: User }): React.ReactElement {
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-duolingo-blue flex items-center justify-center text-white font-bold text-sm">
        {user.displayName[0]?.toUpperCase() ?? "?"}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{user.displayName}</p>
        <p className="text-xs text-gray-400 capitalize">{user.role}</p>
      </div>
      <div className="ml-auto text-xs text-orange-400 font-bold">
        🔥 {user.streak}
      </div>
    </div>
  );
}

// ─── Chat Header ─────────────────────────────────────────────

function ChatHeader({ course }: { course: Course }): React.ReactElement {
  return (
    <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-duolingo-green rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-duolingo">
        {course.language.toUpperCase()}
      </div>
      <div>
        <h1 className="font-bold text-gray-800">{course.name}</h1>
        <p className="text-xs text-gray-400">
          Level {course.level} · {course.studentIds.length} students
        </p>
      </div>
      <div className="ml-auto">
        <span className="text-xs font-bold bg-green-100 text-green-600 px-3 py-1 rounded-full">
          🟢 Live
        </span>
      </div>
    </div>
  );
}

// ─── Main Chat Room ──────────────────────────────────────────

export function ChatRoom(): React.ReactElement {
  const [mounted, setMounted] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const { messages, addMessage } = useMessages(DEMO_MESSAGES);
  const { errorState, handleError, clearError } = useApiError();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    (data: ChatMessageInput): void => {
      try {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          authorId: DEMO_USER.id,
          author: {
            id: DEMO_USER.id,
            displayName: DEMO_USER.displayName,
            role: DEMO_USER.role,
          },
          timestamp: new Date(),
          status: "sent",
          type: "text",
          language: data.language as SupportedLanguage,
          courseId: data.courseId,
          content: data.content,
        };
        addMessage(newMessage);
      } catch (err) {
        handleError(err);
      }
    },
    [addMessage, handleError],
  );

  if (!mounted) return <div />;

  return (
    <ChatErrorBoundary>
      <div className="flex h-screen bg-gray-50 font-sans">
        {/* Main Chat Column */}
        <div className="flex flex-col flex-1 min-w-0">
          <ChatHeader course={DEMO_COURSE} />

          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
            {errorState.message !== null && (
              <ErrorAlert
                message={errorState.message}
                code={errorState.code ?? ""}
                onDismiss={clearError}
              />
            )}

            {messages.map((message) => (
              <MessageRenderer
                key={message.id}
                message={message}
                currentUserId={DEMO_USER.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <SendMessageForm
            courseId={DEMO_COURSE.id}
            defaultLanguage={DEMO_USER.learningLanguage}
            onSend={handleSend}
          />
        </div>

        {/* Sidebar */}
        <div
          className={`w-64 bg-white border-l border-gray-100 flex flex-col shrink-0 ${
            showParticipants ? "" : "hidden md:flex"
          }`}
        >
          <div className="p-4 bg-gradient-to-br from-duolingo-green to-emerald-400 text-white m-4 rounded-2xl shadow-duolingo">
            <p className="text-xs opacity-80 font-medium uppercase tracking-wide">
              Your Progress
            </p>
            <p className="text-2xl font-black mt-1">{DEMO_USER.xp} XP</p>
            <p className="text-sm font-medium mt-1 opacity-90">
              🔥 {DEMO_USER.streak} day streak
            </p>
          </div>

          <div className="px-4 pb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Participants
            </p>
            <ParticipantBadge user={DEMO_USER} />
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setShowParticipants((p) => !p)}
          className="md:hidden fixed bottom-20 right-4 bg-duolingo-green text-white w-12 h-12 rounded-full shadow-duolingo-lg flex items-center justify-center text-xl"
          aria-label="Toggle participants"
        >
          👥
        </button>
      </div>
    </ChatErrorBoundary>
  );
}
