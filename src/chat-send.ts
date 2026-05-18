/**
 * @purpus/inapp-chat-contracts — chat-send.ts
 *
 * Single source of truth for the belongity-chat-send Trigger.dev task contract.
 * Both service_inapp_chat and pngine import from this package.
 * Do NOT re-declare these types in either consumer repo.
 *
 * v1.0.0 — 2026-05-19
 */

/**
 * Reasons the in-app channel is unavailable.
 * These map to specific fallback routing decisions in pngine.
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
 * When success === false && fallback_needed === true, pngine cascades
 * to WhatsApp → SMS → email via its fallbackRouter.
 */
export type ChatSendResult =
  | { success: true }
  | {
      success: false;
      fallback_needed: true;
      reason: ChatSendFailureReason;
      /** Internal DB integer — needed by pngine for WhatsApp number lookup. */
      userId: number;
      /** Public-safe UUID — needed for cross-service audit logs. */
      userIdentifier: string;
    };
