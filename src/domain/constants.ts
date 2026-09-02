export const GUEST_STORAGE_KEY = "emotional-friend:guest-session";
export const GUEST_SCHEMA_VERSION = 1 as const;
export const GUEST_STORAGE_MAX_BYTES = 1_000_000;
export const GUEST_INACTIVITY_MS = 30 * 60 * 1_000;
export const GUEST_CLOCK_SKEW_ALLOWANCE_MS = 60 * 1_000;

export const DISPLAY_NAME_MAX_CODE_POINTS = 80;
export const CHAT_TITLE_MAX_CODE_POINTS = 100;
export const MESSAGE_MAX_CODE_POINTS = 8_000;
export const GUEST_HISTORY_MAX_MESSAGES = 5;
export const AUTH_PASSWORD_MIN_CODE_POINTS = 8;

export const CHAT_PAGE_SIZE = 50;
export const MESSAGE_PAGE_SIZE = 50;

export const API_TIMEOUT_MS = 20_000;
export const API_MAX_ATTEMPTS = 2;
export const RETRY_JITTER_MIN_MS = 400;
export const RETRY_JITTER_MAX_MS = 2_000;

export const CAMERA_MODEL_VERSION = "face-expression-v1";
export const CAMERA_MODEL_PATH = `/models/${CAMERA_MODEL_VERSION}`;
export const EXPRESSION_SAMPLE_INTERVAL_MS = 2_000;
export const NON_NEUTRAL_CONFIDENCE_THRESHOLD = 0.65;
export const MEDIUM_CONFIDENCE_THRESHOLD = 0.7;
export const HIGH_CONFIDENCE_THRESHOLD = 0.85;
export const EXPRESSION_STABLE_SAMPLE_COUNT = 2;
