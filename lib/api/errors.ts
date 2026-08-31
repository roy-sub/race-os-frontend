/**
 * The error taxonomy, mirrored from the backend.
 *
 * The API's contract is `{ error: { code, message, request_id, field?, details? } }`
 * for every deliberate failure (backend/raceos/api/errors.py). The status code is
 * derived from `code` there, so the client branches on `code` and never on status.
 *
 * Two of these codes are not errors in the product sense and must not be rendered
 * as one:
 *
 * - `INFEASIBLE` is a *verdict*. A 422 carrying it means the solve ran and the
 *   answer is "not at this goal", with the levers that would change it.
 * - `OVER_CEILING` is a *warning with an override*, not a refusal.
 *
 * `STALE_DATA` and `PARTIAL_DATA` are declared warnings backend-side, but the
 * backend collects and never emits them, so they only ever arrive here as errors
 * (which backend-side means a 500 — a programming mistake made visible).
 */

export const ERROR_CODES = [
  "INVALID_INPUT",
  "INFEASIBLE",
  "OVER_CEILING",
  "UPLOAD_FAILED",
  "STALE_DATA",
  "PARTIAL_DATA",
  "FREEZE_WINDOW",
  "FORBIDDEN_STRUCTURAL",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "PAYMENT_REQUIRED",
  "NOT_FOUND",
  "CONFLICT",
  "SOLVER_TIMEOUT",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
  "SERVICE_UNAVAILABLE",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const ERROR_CODE_SET: ReadonlySet<string> = new Set(ERROR_CODES);

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && ERROR_CODE_SET.has(value);
}

/** The body of an `INFEASIBLE` response — SOLVER_MODEL.md §F.5. */
export type InfeasibleDetails = {
  /** The **earliest missed** barrier, not the tightest. Build the message from this. */
  barrier: string;
  miss_minutes: number;
  levers: string[];
  /** Carried for the admin blast-radius view. Never phrase the athlete's message from it. */
  tightest_barrier: string;
  tightest_miss_minutes: number;
};

/** The `details` of a 402, matching the fields on an entitlement row. */
export type PaymentRequiredDetails = {
  action?: string;
  required_tiers?: string[];
  purchasable_per_race?: boolean;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  request_id?: string;
  field?: string;
  details?: Record<string, unknown>;
};

/**
 * Any deliberate API failure, plus the two shapes that are not really failures.
 *
 * `requestId` is surfaced on every error screen: it is the only handle a user has
 * on a specific failure, and the backend logs against the same value.
 */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly requestId?: string;
  readonly field?: string;
  readonly details: Record<string, unknown>;

  constructor(init: {
    code: ErrorCode;
    message: string;
    status: number;
    requestId?: string;
    field?: string;
    details?: Record<string, unknown>;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.code = init.code;
    this.status = init.status;
    this.requestId = init.requestId;
    this.field = init.field;
    this.details = init.details ?? {};
  }

  /** True when this is the solver's "not at this goal" verdict rather than a fault. */
  get isVerdict(): boolean {
    return this.code === "INFEASIBLE";
  }

  get infeasible(): InfeasibleDetails | null {
    if (this.code !== "INFEASIBLE") return null;
    const d = this.details as Partial<InfeasibleDetails>;
    if (typeof d.barrier !== "string") return null;
    return {
      barrier: d.barrier,
      miss_minutes: Number(d.miss_minutes ?? 0),
      levers: Array.isArray(d.levers) ? d.levers.map(String) : [],
      tightest_barrier: String(d.tightest_barrier ?? d.barrier),
      tightest_miss_minutes: Number(d.tightest_miss_minutes ?? d.miss_minutes ?? 0),
    };
  }

  get paymentRequired(): PaymentRequiredDetails | null {
    if (this.code !== "PAYMENT_REQUIRED") return null;
    const d = this.details as PaymentRequiredDetails;
    return {
      action: typeof d.action === "string" ? d.action : undefined,
      required_tiers: Array.isArray(d.required_tiers) ? d.required_tiers.map(String) : [],
      purchasable_per_race: d.purchasable_per_race === true,
    };
  }

  /** `RATE_LIMITED` carries this so a retry can name a real number of seconds. */
  get retryAfterSeconds(): number | null {
    const v = this.details.retry_after_seconds;
    return typeof v === "number" ? v : null;
  }
}

/**
 * A failure that never reached the API — DNS, TLS, a blocked CORS preflight, an
 * offline device. It is deliberately mapped onto `SERVICE_UNAVAILABLE` so that
 * every screen has exactly one error type to render and one copy table to read.
 */
export class NetworkError extends ApiError {
  constructor(cause: unknown) {
    super({
      code: "SERVICE_UNAVAILABLE",
      message: "The request never reached RaceOS.",
      status: 0,
      details: { cause: cause instanceof Error ? cause.message : String(cause) },
    });
    this.name = "NetworkError";
  }
}

/**
 * Coerce anything the API returned into an `ApiError`.
 *
 * An unrecognised body is `INTERNAL_ERROR` rather than a guess: inventing a code
 * would send the user to copy written for a different failure.
 */
export function toApiError(status: number, body: unknown, headerRequestId?: string): ApiError {
  const envelope =
    body && typeof body === "object" && "error" in body
      ? ((body as { error: unknown }).error as Partial<ApiErrorBody> | undefined)
      : undefined;

  const code = isErrorCode(envelope?.code) ? envelope.code : fallbackCodeForStatus(status);

  return new ApiError({
    code,
    message:
      typeof envelope?.message === "string" && envelope.message
        ? envelope.message
        : `The request failed with status ${status}.`,
    status,
    requestId:
      (typeof envelope?.request_id === "string" ? envelope.request_id : undefined) ??
      headerRequestId,
    field: typeof envelope?.field === "string" ? envelope.field : undefined,
    details:
      envelope?.details && typeof envelope.details === "object"
        ? (envelope.details as Record<string, unknown>)
        : {},
  });
}

/** Only reached when a proxy or platform answered instead of the API. */
function fallbackCodeForStatus(status: number): ErrorCode {
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 402) return "PAYMENT_REQUIRED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  if (status === 422) return "INVALID_INPUT";
  if (status === 503) return "SERVICE_UNAVAILABLE";
  return "INTERNAL_ERROR";
}
