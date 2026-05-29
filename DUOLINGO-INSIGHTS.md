# Duolingo Engineering Insights — Type-Safe Educational Platform

## 1. TypeScript Static Analysis & Classroom Safety

**How does TypeScript's static analysis prevent unsafe content from reaching classroom environments?**

TypeScript's compile-time checks act as the *first line of defence*. By defining strict types for every message (`ChatMessage` as a discriminated union), the compiler rejects any code that tries to send an unvalidated or wrongly-shaped payload. For example, the `MessageStatus` type only allows `"pending" | "sent" | "delivered" | "flagged" | "removed"` — it's impossible to introduce a new status without updating every `switch` statement that handles it (enforced via the `never` exhaustive check in `MessageRenderer`).

**What role do strict type definitions play in content filtering and moderation?**

Strict types make moderation logic *self-documenting and tamper-resistant*:
- `ModerationSeverity` and `ModerationAction` are string literal unions — they cannot be misspelled or extended accidentally.
- `ModerationResult` uses `readonly` on every field, preventing mutation after a moderation decision is made.
- The `createContentValidator<T extends { content: string }>` generic ensures any content-bearing object can be run through the moderation pipeline without losing its specific type.

**How does strict TypeScript configuration ensure reliability at scale?**

The `tsconfig.json` enables:
| Option | Why it matters |
|---|---|
| `strict: true` | Enables all strict checks, including `strictNullChecks` |
| `noImplicitReturns` | Functions must return a value on every code path |
| `noUnusedLocals` / `noUnusedParameters` | Dead code is caught at compile time |
| `exactOptionalPropertyTypes` | `undefined` and missing properties are treated differently |
| `noFallthroughCasesInSwitch` | Every `switch` case must be intentional |

---

## 2. TypeScript Generics & Utility Types

**How do generics enable reusable components across different language courses?**

The `MessageWrapper<T extends ChatMessage>` component accepts *any* message subtype while preserving full type information for its children. This means a Spanish course and a Japanese course both use the same wrapper — but TypeScript still knows the exact message shape inside.

The `createContentValidator<T extends { content: string }>` utility demonstrates a *constrained generic*: it works on any type that has a `content` string field, returning `{ item: T; moderation: ModerationResult }` — so the caller never loses the original type.

**Utility types used in this project:**
- `Partial<Record<SupportedLanguage, string>>` — translations map (only some languages may exist)
- `Pick<User, "id" | "displayName" | "avatarUrl" | "role">` — lightweight author reference in messages
- `Omit` — used in `StrictPartial<T, K>` to build selective-optional types
- `Extract<ChatMessage, { type: T }>` — the `ExtractMessage<T>` helper pulls the right variant from the union
- `DeepReadonly<T>` — recursive readonly for deeply immutable data structures
- `Record<UserRole, { label: string; className: string }>` — exhaustive role → style mapping

**Type Guards:**
```typescript
// Compile-time narrowing via type guard function
export function isModerationSeverity(value: string): value is ModerationSeverity {
  const severities: ModerationSeverity[] = ["none", "low", "medium", "high", "critical"];
  return (severities as string[]).includes(value);
}
```

---

## 3. Zod Runtime Validation & Educational Content Safety

**Why is runtime validation necessary even with TypeScript?**

TypeScript types exist only at *compile time*. At runtime, data coming from a network API, user input, or a database is just `unknown`. Zod bridges this gap — it validates and *infers* TypeScript types from the same schema definition.

```typescript
// One schema definition → both validation + TypeScript type
export const ChatMessageSchema = z.object({ ... });
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
```

**Key Zod patterns implemented:**
| Pattern | Where Used | Purpose |
|---|---|---|
| `.refine()` | `ChatMessageSchema` | Custom content safety checks |
| `.transform()` | `ChatMessageSchema` | Auto-trim whitespace |
| `.superRefine()` / cross-field | `UserRegistrationSchema` | Password match, language ≠ native |
| `z.coerce.number()` | `PaginationSchema` | Safely parse URL query params |
| `satisfies z.ZodType<T>` | `SupportedLanguageSchema` | Sync Zod schema with TypeScript enum |

**Age-appropriate content validation:**
The `ChatMessageSchema` uses `.refine()` with two checks:
1. Pattern matching for spam/cheat/scam keywords
2. Regex detection of phone numbers and email addresses (personal info leakage prevention)

If a message triggers either check, Zod returns a human-readable error instead of blocking silently — teachers and students get clear feedback.

---

## 4. Type-Safe API Communication

**End-to-end type safety strategy:**

```
User Input → Zod Parse → TypeScript Type → API Request → Zod Response Parse → Component
```

Every step validates data. The `request<T>()` helper in `client.ts` takes a `z.ZodType<T>` argument and parses the API response, so if the server changes its response shape, the error is caught immediately with a `ValidationError` (not a silent `undefined`).

**Custom error class hierarchy:**
```
Error
└── ApiClientError      (base — has `code` and optional `details`)
    ├── ValidationError     (field-level errors from Zod)
    ├── ContentSafetyError  (content blocked by moderation)
    └── NetworkError        (fetch() failed)
```

This hierarchy means `catch` blocks can use `instanceof` narrowing to handle each error type differently — no stringly-typed `error.type === "validation"` checks.

---

## 5. Error Handling & Student Safety Architecture

**Error boundary design decisions:**

The `ChatErrorBoundary` (class component — required for `componentDidCatch`) renders three different fallback UIs depending on error type:
- `ContentSafetyError` → Educational message about classroom safety
- `ApiClientError` → Duo mascot + retry button
- Generic `Error` → Friendly reassurance + reload

**`useApiError` hook pattern:**
Instead of scattering `try/catch` logic across components, the `useApiError` hook centralises error handling. Components call `handleError(err)` and read `errorState.message` — one hook manages all the complexity of `instanceof` narrowing and field-error extraction.

**Real-time moderation UX:**
The `SendMessageForm` calls `moderateContent()` on every `onChange` event (debounce is available via `useDebounce`), showing an inline warning *before* the user tries to send. This is more educational than blocking silently — students learn what's appropriate.

---

## Key Learnings

1. **TypeScript generics + Zod = zero runtime surprises.** Compile-time safety catches shape errors; Zod catches value errors.
2. **Discriminated unions are the right pattern for chat messages.** The `never` exhaustive check in `MessageRenderer` means adding a new message type *forces* a UI implementation.
3. **Custom error classes make `instanceof` narrowing clean and explicit.**
4. **Content moderation at the form layer (not just the API layer) gives students better feedback.**
5. **`readonly` on all interfaces prevents accidental mutation of message history.**
