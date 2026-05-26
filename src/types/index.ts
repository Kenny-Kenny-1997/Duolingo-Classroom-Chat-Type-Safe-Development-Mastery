// ============================================================
// DUOLINGO CLASSROOM CHAT — Core Type Definitions
// Strict, educational-grade TypeScript type system
// ============================================================

// ─── Language Support ───────────────────────────────────────
export type SupportedLanguage =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "ja"
  | "ko"
  | "zh"
  | "pt"
  | "it"
  | "ru";

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  pt: "Portuguese",
  it: "Italian",
  ru: "Russian",
};

// ─── User Roles ──────────────────────────────────────────────
export type UserRole = "student" | "teacher" | "moderator" | "admin";

export interface User {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly avatarUrl?: string;
  readonly learningLanguage: SupportedLanguage;
  readonly nativeLanguage: SupportedLanguage;
  readonly xp: number;
  readonly streak: number;
  readonly createdAt: Date;
}

// ─── Message Types ───────────────────────────────────────────
export type MessageStatus = "pending" | "sent" | "delivered" | "flagged" | "removed";
export type MessageType = "text" | "exercise" | "achievement" | "system" | "translation";

export interface BaseMessage {
  readonly id: string;
  readonly authorId: string;
  readonly author: Pick<User, "id" | "displayName" | "avatarUrl" | "role">;
  readonly timestamp: Date;
  readonly status: MessageStatus;
  readonly type: MessageType;
  readonly language: SupportedLanguage;
  readonly courseId: string;
}

export interface TextMessage extends BaseMessage {
  readonly type: "text";
  readonly content: string;
  readonly translatedContent?: Partial<Record<SupportedLanguage, string>>;
}

export interface ExerciseMessage extends BaseMessage {
  readonly type: "exercise";
  readonly exerciseId: string;
  readonly prompt: string;
  readonly answer?: string;
  readonly isCorrect?: boolean;
}

export interface AchievementMessage extends BaseMessage {
  readonly type: "achievement";
  readonly achievementName: string;
  readonly xpEarned: number;
  readonly badgeUrl?: string;
}

export interface SystemMessage extends BaseMessage {
  readonly type: "system";
  readonly systemContent: string;
}

export interface TranslationMessage extends BaseMessage {
  readonly type: "translation";
  readonly originalContent: string;
  readonly originalLanguage: SupportedLanguage;
  readonly translatedContent: string;
  readonly targetLanguage: SupportedLanguage;
}

// Union type for all messages — type-safe discriminated union
export type ChatMessage =
  | TextMessage
  | ExerciseMessage
  | AchievementMessage
  | SystemMessage
  | TranslationMessage;

// ─── Content Moderation ─────────────────────────────────────
export type ModerationSeverity = "none" | "low" | "medium" | "high" | "critical";
export type ModerationAction = "allow" | "warn" | "filter" | "block" | "report";

export interface ModerationResult {
  readonly severity: ModerationSeverity;
  readonly action: ModerationAction;
  readonly categories: ModerationCategory[];
  readonly filteredContent?: string;
  readonly reason?: string;
}

export type ModerationCategory =
  | "profanity"
  | "hate_speech"
  | "personal_info"
  | "spam"
  | "off_topic"
  | "inappropriate_for_age"
  | "safe";

// ─── Classroom / Course ──────────────────────────────────────
export interface Course {
  readonly id: string;
  readonly name: string;
  readonly language: SupportedLanguage;
  readonly level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  readonly teacherId: string;
  readonly studentIds: readonly string[];
  readonly maxStudents: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export interface ChatRoom {
  readonly id: string;
  readonly courseId: string;
  readonly course: Course;
  readonly messages: readonly ChatMessage[];
  readonly participants: readonly User[];
  readonly createdAt: Date;
  readonly isActive: boolean;
}

// ─── Generic Utility Types ───────────────────────────────────

// Makes all nested properties readonly
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// Safe version of Partial that excludes undefined from result
export type StrictPartial<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Extract specific message type from union
export type ExtractMessage<T extends MessageType> = Extract<
  ChatMessage,
  { type: T }
>;

// Type guard helper type
export type TypeGuard<T> = (value: unknown) => value is T;

// API response wrapper
export interface ApiResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly timestamp: Date;
}

export interface ApiError {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, string[]>;
  };
  readonly timestamp: Date;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Pagination
export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

// ─── Form Types ──────────────────────────────────────────────
export interface SendMessageFormData {
  content: string;
  language: SupportedLanguage;
  courseId: string;
}

export interface CreateCourseFormData {
  name: string;
  language: SupportedLanguage;
  level: Course["level"];
  maxStudents: number;
}
