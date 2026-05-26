// ============================================================
// DUOLINGO CLASSROOM CHAT — Zod Validation Schemas
// Runtime validation for educational content safety
// ============================================================

import { z } from "zod";
import type { SupportedLanguage, ModerationCategory } from "@/types";

// ─── Supported Languages Schema ──────────────────────────────
export const SupportedLanguageSchema = z.enum([
  "en", "es", "fr", "de", "ja", "ko", "zh", "pt", "it", "ru",
]) satisfies z.ZodType<SupportedLanguage>;

// ─── Content Filtering Helpers ───────────────────────────────

// Basic inappropriate word patterns (educational context)
const INAPPROPRIATE_PATTERNS = [
  /\b(spam|scam|hack|cheat)\b/i,
  // Personal info patterns
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // emails
];

function containsInappropriateContent(text: string): boolean {
  return INAPPROPRIATE_PATTERNS.some((pattern) => pattern.test(text));
}

function containsPersonalInfo(text: string): boolean {
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  return phoneRegex.test(text) || emailRegex.test(text);
}

// ─── Message Validation Schema ───────────────────────────────
export const ChatMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message too long — keep it under 500 characters")
    .refine(
      (val) => !containsInappropriateContent(val),
      "This message contains content not suitable for the classroom"
    )
    .refine(
      (val) => !containsPersonalInfo(val),
      "Please do not share personal contact information in the classroom"
    )
    .transform((val) => val.trim()),

  language: SupportedLanguageSchema,

  courseId: z
    .string()
    .uuid("Invalid course ID")
    .min(1, "Course ID is required"),
});

export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

// ─── User Registration Schema ────────────────────────────────
export const UserRegistrationSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens"
      ),

    displayName: z
      .string()
      .min(2, "Display name must be at least 2 characters")
      .max(30, "Display name must be at most 30 characters"),

    email: z.string().email("Please enter a valid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),

    confirmPassword: z.string(),

    learningLanguage: SupportedLanguageSchema,
    nativeLanguage: SupportedLanguageSchema,

    role: z.enum(["student", "teacher"]),

    ageConfirmation: z
      .boolean()
      .refine((val) => val === true, "You must confirm your age to join"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.learningLanguage !== data.nativeLanguage, {
    message: "Learning language must be different from your native language",
    path: ["learningLanguage"],
  });

export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;

// ─── Create Course Schema ────────────────────────────────────
export const CreateCourseSchema = z.object({
  name: z
    .string()
    .min(3, "Course name must be at least 3 characters")
    .max(60, "Course name must be at most 60 characters"),

  language: SupportedLanguageSchema,

  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"], {
    errorMap: () => ({ message: "Please select a valid CEFR level" }),
  }),

  maxStudents: z
    .number()
    .int("Must be a whole number")
    .min(2, "Must allow at least 2 students")
    .max(50, "Cannot exceed 50 students per course"),
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

// ─── Moderation Action Schema ─────────────────────────────────
export const ModerationActionSchema = z.object({
  messageId: z.string().uuid("Invalid message ID"),
  action: z.enum(["allow", "warn", "filter", "block", "report"]),
  reason: z.string().min(10, "Please provide a reason of at least 10 characters").max(200),
  categories: z
    .array(
      z.enum([
        "profanity",
        "hate_speech",
        "personal_info",
        "spam",
        "off_topic",
        "inappropriate_for_age",
        "safe",
      ]) satisfies z.ZodType<ModerationCategory>
    )
    .min(1, "Select at least one category"),
});

export type ModerationActionInput = z.infer<typeof ModerationActionSchema>;

// ─── Pagination Query Schema ─────────────────────────────────
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
  courseId: z.string().uuid().optional(),
  language: SupportedLanguageSchema.optional(),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
