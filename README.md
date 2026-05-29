# Duolingo Classroom Chat

A type-safe, enterprise-grade classroom chat system built with Next.js 14, TypeScript, Zod, and React Hook Form — modelled on Duolingo's educational platform architecture.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS |
| Runtime Validation | Zod 3 |
| Forms | React Hook Form + `@hookform/resolvers` |
| Linting | ESLint + `@typescript-eslint` |

---

## Project Structure

```
duolingo-classroom-chat/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page → ChatRoom
│   │   └── globals.css         # Tailwind base styles
│   ├── components/
│   │   ├── chat/
│   │   │   ├── MessageComponents.tsx   # Generic message renderers
│   │   │   └── ChatRoom.tsx            # Full chat room UI
│   │   ├── forms/
│   │   │   └── SendMessageForm.tsx     # RHF + Zod validated form
│   │   └── ui/
│   │       └── ErrorBoundary.tsx       # Type-safe error boundaries
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts       # Type-safe API client + error classes
│   │   ├── hooks/
│   │   │   └── index.ts        # useMessages, useContentModeration, useApiError
│   │   └── validation/
│   │       ├── schemas.ts      # All Zod schemas
│   │       └── moderation.ts   # Content filtering system
│   └── types/
│       └── index.ts            # Core TypeScript type definitions
├── tsconfig.json               # Strict TypeScript config
├── tailwind.config.ts          # Duolingo design tokens
├── .eslintrc.json              # TypeScript ESLint rules
├── package.json
├── README.md
└── DUOLINGO-INSIGHTS.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd duolingo-classroom-chat
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Type Check

```bash
npm run type-check
```

### Lint

```bash
npm run lint
```

### Build

```bash
npm run build
```

---

## Architecture Highlights

### 1. Discriminated Union Message Types

All chat messages share a `BaseMessage` interface and are combined into a `ChatMessage` union type. The `MessageRenderer` component uses an exhaustive `switch` — TypeScript will error if a new message type is added without a corresponding UI implementation.

```typescript
type ChatMessage =
  | TextMessage
  | ExerciseMessage
  | AchievementMessage
  | SystemMessage
  | TranslationMessage;
```

### 2. Zod Schemas with Content Safety

`ChatMessageSchema` uses `.refine()` for educational content validation:

```typescript
content: z.string()
  .max(500)
  .refine(val => !containsInappropriateContent(val), "Not suitable for classroom")
  .refine(val => !containsPersonalInfo(val), "Do not share personal info")
  .transform(val => val.trim())
```

### 3. Custom Error Hierarchy

```
ApiClientError
├── ValidationError       — field-level Zod errors
├── ContentSafetyError    — moderation blocks
└── NetworkError          — fetch() failures
```

### 4. Path Aliases (tsconfig.json)

Clean imports via configured path mapping:

```typescript
import { moderateContent } from "@/lib/validation/moderation";
import type { ChatMessage } from "@/types";
```

### 5. Supported Languages

The platform supports 10 languages: English, Spanish, French, German, Japanese, Korean, Chinese, Portuguese, Italian, Russian.

---

## Content Safety Features

- Real-time moderation feedback as the user types
- Phone number and email address detection (personal info protection)
- URL filtering in classroom messages
- Repeated character spam detection
- Final safety check before API submission
- Teacher-visible moderation categories and severity levels

---

## TypeScript Configuration

Key strict options enabled in `tsconfig.json`:

- `strict: true` — all strict checks
- `noUnusedLocals` + `noUnusedParameters` — no dead code
- `noImplicitReturns` — all code paths must return
- `exactOptionalPropertyTypes` — precise optional handling
- `noFallthroughCasesInSwitch` — explicit switch cases
