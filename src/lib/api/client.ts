// ============================================================
// DUOLINGO CLASSROOM CHAT — Type-Safe API Client
// End-to-end type safety for all API communication
// ============================================================

import { z } from "zod";
import type { ApiResult, ChatMessage, PaginatedResult, Course, User } from "@/types";
import {
  ChatMessageSchema,
  CreateCourseSchema,
  PaginationSchema,
  type ChatMessageInput,
  type CreateCourseInput,
  type PaginationInput,
} from "@/lib/validation/schemas";

// ─── API Error Classes ───────────────────────────────────────

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    code: string,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApiClientError {
  constructor(details: Record<string, string[]>) {
    super("Validation failed", "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class ContentSafetyError extends ApiClientError {
  public readonly reason: string;

  constructor(reason: string) {
    super("Content flagged by safety system", "CONTENT_SAFETY", {
      content: [reason],
    });
    this.name = "ContentSafetyError";
    this.reason = reason;
  }
}

export class NetworkError extends ApiClientError {
  constructor(originalError: unknown) {
    super(
      "Network request failed. Please check your connection.",
      "NETWORK_ERROR"
    );
    this.name = "NetworkError";
    this.cause = originalError;
  }
}

// ─── Request Helper ──────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

async function request<T>(
  endpoint: string,
  options: RequestInit,
  responseSchema: z.ZodType<T>
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
  } catch (err) {
    throw new NetworkError(err);
  }

  const json: unknown = await response.json();

  if (!response.ok) {
    const errorResult = json as ApiResult<never>;
    if (!errorResult.success) {
      throw new ApiClientError(
        errorResult.error.message,
        errorResult.error.code,
        errorResult.error.details
      );
    }
    throw new ApiClientError("An unexpected error occurred", "UNKNOWN_ERROR");
  }

  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      fieldErrors[path] = [...(fieldErrors[path] ?? []), issue.message];
    }
    throw new ValidationError(fieldErrors);
  }

  return parsed.data;
}

// ─── Message Response Schemas ────────────────────────────────
// These wrap the API response in a type-safe way

const MessageApiSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().uuid(),
    authorId: z.string().uuid(),
    author: z.object({
      id: z.string(),
      displayName: z.string(),
      avatarUrl: z.string().optional(),
      role: z.enum(["student", "teacher", "moderator", "admin"]),
    }),
    timestamp: z.string().transform((s) => new Date(s)),
    status: z.enum(["pending", "sent", "delivered", "flagged", "removed"]),
    type: z.literal("text"),
    language: z.enum(["en", "es", "fr", "de", "ja", "ko", "zh", "pt", "it", "ru"]),
    courseId: z.string().uuid(),
    content: z.string(),
  }),
  timestamp: z.string().transform((s) => new Date(s)),
});

// ─── API Client Methods ──────────────────────────────────────

export const apiClient = {
  // Messages
  messages: {
    async send(input: ChatMessageInput): Promise<ChatMessage> {
      const validated = ChatMessageSchema.parse(input);
      const result = await request(
        "/messages",
        {
          method: "POST",
          body: JSON.stringify(validated),
        },
        MessageApiSchema
      );
      return result.data as ChatMessage;
    },

    async list(
      pagination: PaginationInput
    ): Promise<PaginatedResult<ChatMessage>> {
      const validated = PaginationSchema.parse(pagination);
      const params = new URLSearchParams({
        page: String(validated.page),
        pageSize: String(validated.pageSize),
        ...(validated.courseId ? { courseId: validated.courseId } : {}),
        ...(validated.language ? { language: validated.language } : {}),
      });

      return request(
        `/messages?${params.toString()}`,
        { method: "GET" },
        z.object({
          success: z.literal(true),
          data: z.object({
            items: z.array(z.unknown()),
            total: z.number(),
            page: z.number(),
            pageSize: z.number(),
            hasNextPage: z.boolean(),
            hasPreviousPage: z.boolean(),
          }),
          timestamp: z.string().transform((s) => new Date(s)),
        }).transform((r) => r.data as PaginatedResult<ChatMessage>)
      );
    },
  },

  // Courses
  courses: {
    async create(input: CreateCourseInput): Promise<Course> {
      const validated = CreateCourseSchema.parse(input);
      return request(
        "/courses",
        {
          method: "POST",
          body: JSON.stringify(validated),
        },
        z.object({
          success: z.literal(true),
          data: z.unknown(),
          timestamp: z.string().transform((s) => new Date(s)),
        }).transform((r) => r.data as Course)
      );
    },

    async list(): Promise<Course[]> {
      return request(
        "/courses",
        { method: "GET" },
        z.object({
          success: z.literal(true),
          data: z.array(z.unknown()),
          timestamp: z.string().transform((s) => new Date(s)),
        }).transform((r) => r.data as Course[])
      );
    },
  },

  // Users
  users: {
    async getCurrent(): Promise<User> {
      return request(
        "/users/me",
        { method: "GET" },
        z.object({
          success: z.literal(true),
          data: z.unknown(),
          timestamp: z.string().transform((s) => new Date(s)),
        }).transform((r) => r.data as User)
      );
    },
  },
};
