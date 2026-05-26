// ============================================================
// DUOLINGO CLASSROOM CHAT — Content Moderation System
// Type-safe educational content filtering
// ============================================================

import type {
  ModerationResult,
  ModerationSeverity,
  ModerationAction,
  ModerationCategory,
} from "@/types";

// ─── Type Guards ─────────────────────────────────────────────

export function isModerationSeverity(value: string): value is ModerationSeverity {
  const severities: ModerationSeverity[] = ["none", "low", "medium", "high", "critical"];
  return (severities as string[]).includes(value);
}

export function isModerationAction(value: string): value is ModerationAction {
  const actions: ModerationAction[] = ["allow", "warn", "filter", "block", "report"];
  return (actions as string[]).includes(value);
}

// ─── Moderation Rules ────────────────────────────────────────

interface ModerationRule {
  readonly category: ModerationCategory;
  readonly pattern: RegExp;
  readonly severity: ModerationSeverity;
  readonly action: ModerationAction;
}

const MODERATION_RULES: readonly ModerationRule[] = [
  {
    category: "personal_info",
    pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    severity: "high",
    action: "filter",
  },
  {
    category: "personal_info",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    severity: "high",
    action: "filter",
  },
  {
    category: "spam",
    pattern: /(.)\1{4,}/,
    severity: "low",
    action: "warn",
  },
  {
    category: "spam",
    pattern: /(https?:\/\/[^\s]+)/gi,
    severity: "medium",
    action: "filter",
  },
];

// ─── Severity Ordering ───────────────────────────────────────

const SEVERITY_ORDER: Record<ModerationSeverity, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function getHighestSeverity(severities: ModerationSeverity[]): ModerationSeverity {
  if (severities.length === 0) return "none";
  return severities.reduce((max, current) =>
    SEVERITY_ORDER[current] > SEVERITY_ORDER[max] ? current : max
  );
}

function getActionForSeverity(severity: ModerationSeverity): ModerationAction {
  const actionMap: Record<ModerationSeverity, ModerationAction> = {
    none: "allow",
    low: "warn",
    medium: "filter",
    high: "block",
    critical: "report",
  };
  return actionMap[severity];
}

// ─── Filter Personal Info ────────────────────────────────────

function filterPersonalInfo(content: string): string {
  let filtered = content;
  // Replace phone numbers
  filtered = filtered.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE REMOVED]");
  // Replace email addresses
  filtered = filtered.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    "[EMAIL REMOVED]"
  );
  // Replace URLs
  filtered = filtered.replace(/(https?:\/\/[^\s]+)/gi, "[LINK REMOVED]");
  return filtered;
}

// ─── Main Moderation Function ────────────────────────────────

export function moderateContent(content: string): ModerationResult {
  const triggeredRules = MODERATION_RULES.filter((rule) =>
    rule.pattern.test(content)
  );

  if (triggeredRules.length === 0) {
    return {
      severity: "none",
      action: "allow",
      categories: ["safe"],
    };
  }

  const categories = [
    ...new Set(triggeredRules.map((r) => r.category)),
  ] as ModerationCategory[];

  const severity = getHighestSeverity(triggeredRules.map((r) => r.severity));
  const action = getActionForSeverity(severity);

  const filteredContent =
    action === "filter" || action === "block"
      ? filterPersonalInfo(content)
      : undefined;

  const reason = `Content flagged for: ${categories.join(", ")}`;

  return {
    severity,
    action,
    categories,
    ...(filteredContent !== undefined ? { filteredContent } : {}),
    reason,
  };
}

// ─── Generic Content Validator ───────────────────────────────

export function createContentValidator<T extends { content: string }>(
  additionalRules?: Array<(content: string) => ModerationResult | null>
): (item: T) => { item: T; moderation: ModerationResult } {
  return (item: T) => {
    const baseResult = moderateContent(item.content);

    if (additionalRules && additionalRules.length > 0) {
      const extraResults = additionalRules
        .map((rule) => rule(item.content))
        .filter((r): r is ModerationResult => r !== null);

      if (extraResults.length > 0) {
        const allSeverities = [baseResult.severity, ...extraResults.map((r) => r.severity)];
        const combinedSeverity = getHighestSeverity(allSeverities);
        const combinedCategories = [
          ...new Set([
            ...baseResult.categories,
            ...extraResults.flatMap((r) => r.categories),
          ]),
        ] as ModerationCategory[];

        return {
          item,
          moderation: {
            severity: combinedSeverity,
            action: getActionForSeverity(combinedSeverity),
            categories: combinedCategories,
            reason: `Combined flags: ${combinedCategories.join(", ")}`,
          },
        };
      }
    }

    return { item, moderation: baseResult };
  };
}
