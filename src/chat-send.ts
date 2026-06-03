/**
 * @purpus/inapp-chat-contracts — chat-send.ts
 *
 * Single source of truth for the belongity-chat-send Trigger.dev task contract.
 * Both service_inapp_chat and pngine import from this package.
 * Do NOT re-declare these types in either consumer repo.
 *
 * v1.0.0 — 2026-05-19
 * v5.0.0 — 2026-06-04 — Y1: FallbackReason added; Y2: fallback_needed removed;
 *                        Y3: BELONGITY_CHAT_SEND_TASK_ID constant exported
 */

/**
 * v5 Y3: Task ID exported as a constant so both repos import it instead of
 * hardcoding the string. Drift between repos becomes impossible.
 */
export const BELONGITY_CHAT_SEND_TASK_ID = 'belongity-chat-send' as const;

/**
 * Reasons the in-app channel is unavailable.
 * These are CHAT-SERVICE-EMITTED reasons only.
 * The task NEVER returns 'task_crashed' — that label is injected by pngine
 * when run.ok === false (Trigger.dev unexpected failure).
 * See FallbackReason for the broader union used by pngine.
 *
 * user_not_active   — Redis presence TTL expired (PRESENCE_TTL_SECONDS = 300s)
 * no_fcm_token      — No FCM device token on record for this user
 * fcm_send_failed   — FCM returned a non-retryable error code (see FCM_NON_RETRYABLE_CODES)
 */
export type ChatSendFailureReason =
  | 'user_not_active'
  | 'no_fcm_token'
  | 'fcm_send_failed';

/**
 * v5 Y1: Broader failure union used by pngine's fallback router.
 * Includes 'task_crashed' — injected by pngine when Trigger.dev run.ok === false.
 * Chat service code NEVER produces 'task_crashed'; pngine injects it.
 */
export type FallbackReason = ChatSendFailureReason | 'task_crashed';

/**
 * Payload passed to the belongity-chat-send Trigger.dev task.
 */
export interface ChatSendPayload {
  /** Internal DB integer — used by pngine to look up WhatsApp number etc. */
  userId: number;

  /** Public-safe UUID — used in cross-service audit logs and public references. */
  userIdentifier: string;

  /** UUID of the chat thread this message belongs to. */
  threadIdentifier: string;

  notification: {
    title: string;
    body: string;
    /** Optional k/v data for Flutter local notification routing. */
    data?: Record<string, string>;
  };
}

/**
 * Structured result returned by the belongity-chat-send task.
 *
 * The task NEVER throws for the "channel unavailable" condition — that is
 * a normal business outcome modelled as a structured return value.
 * Unhandled exceptions (infrastructure failures) still bubble up as
 * Trigger.dev task failures (run.ok === false on the caller side).
 *
 * v5 Y2: fallback_needed removed — success: false already implies "needs fallback."
 * The discriminant alone is sufficient; a redundant boolean creates two truth-points.
 * If "drop without fallback" semantics is needed later, add a third union arm then.
 */
export type ChatSendResult =
  | { success: true }
  | {
      success: false;
      reason: ChatSendFailureReason;
      /** Internal DB integer — needed by pngine for WhatsApp number lookup. */
      userId: number;
      /** Public-safe UUID — needed for cross-service audit logs. */
      userIdentifier: string;
    };
