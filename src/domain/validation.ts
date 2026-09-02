import {
  AUTH_PASSWORD_MIN_CODE_POINTS,
  CHAT_TITLE_MAX_CODE_POINTS,
  DISPLAY_NAME_MAX_CODE_POINTS,
  MESSAGE_MAX_CODE_POINTS,
} from "./constants";

export type AuthField = "displayName" | "email" | "password" | "confirmation";
export type ValidationCode =
  | "required"
  | "invalid-email"
  | "too-short"
  | "too-long"
  | "password-mismatch";

export interface FieldError<Field extends string = string> {
  field: Field;
  code: ValidationCode;
  message: string;
}

export type ValidationResult<T, Field extends string = string> =
  | { valid: true; value: T }
  | { valid: false; errors: Array<FieldError<Field>> };

export interface SignInValues {
  email: string;
  password: string;
}

export interface SignUpValues extends SignInValues {
  displayName: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function countCodePoints(value: string): number {
  return Array.from(value).length;
}

export function validateEmail(value: string): ValidationResult<string, "email"> {
  const email = value.trim();
  if (!email) {
    return {
      valid: false,
      errors: [{ field: "email", code: "required", message: "Enter your email address." }],
    };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return {
      valid: false,
      errors: [
        {
          field: "email",
          code: "invalid-email",
          message: "Enter a complete email address, for example name@example.com.",
        },
      ],
    };
  }
  return { valid: true, value: email };
}

export function validateDisplayName(
  value: string,
): ValidationResult<string | null, "displayName"> {
  const displayName = value.trim();
  if (!displayName) return { valid: true, value: null };
  if (countCodePoints(displayName) > DISPLAY_NAME_MAX_CODE_POINTS) {
    return {
      valid: false,
      errors: [
        {
          field: "displayName",
          code: "too-long",
          message: `Display name must be ${DISPLAY_NAME_MAX_CODE_POINTS} characters or fewer.`,
        },
      ],
    };
  }
  return { valid: true, value: displayName };
}

export function validatePassword(
  value: string,
): ValidationResult<string, "password"> {
  if (!value) {
    return {
      valid: false,
      errors: [{ field: "password", code: "required", message: "Enter your password." }],
    };
  }
  if (countCodePoints(value) < AUTH_PASSWORD_MIN_CODE_POINTS) {
    return {
      valid: false,
      errors: [
        {
          field: "password",
          code: "too-short",
          message: `Use at least ${AUTH_PASSWORD_MIN_CODE_POINTS} characters.`,
        },
      ],
    };
  }
  return { valid: true, value };
}

export function validateSignIn(input: {
  email: string;
  password: string;
}): ValidationResult<SignInValues, AuthField> {
  const email = validateEmail(input.email);
  const errors: Array<FieldError<AuthField>> = [];
  if (!email.valid) errors.push(...email.errors);
  if (!input.password) {
    errors.push({ field: "password", code: "required", message: "Enter your password." });
  }
  return errors.length
    ? { valid: false, errors }
    : { valid: true, value: { email: email.valid ? email.value : "", password: input.password } };
}

export function validateSignUp(input: {
  displayName: string;
  email: string;
  password: string;
  confirmation: string;
}): ValidationResult<SignUpValues, AuthField> {
  const displayName = validateDisplayName(input.displayName);
  const email = validateEmail(input.email);
  const password = validatePassword(input.password);
  const errors: Array<FieldError<AuthField>> = [];
  if (!displayName.valid) errors.push(...displayName.errors);
  if (!email.valid) errors.push(...email.errors);
  if (!password.valid) errors.push(...password.errors);
  if (input.confirmation !== input.password) {
    errors.push({
      field: "confirmation",
      code: "password-mismatch",
      message: "Passwords do not match.",
    });
  }
  return errors.length
    ? { valid: false, errors }
    : {
        valid: true,
        value: {
          displayName: displayName.valid ? displayName.value : null,
          email: email.valid ? email.value : "",
          password: input.password,
        },
      };
}

export function validateChatTitle(value: string): ValidationResult<string, "title"> {
  const title = value.trim();
  if (!title) {
    return {
      valid: false,
      errors: [{ field: "title", code: "required", message: "Enter a chat name." }],
    };
  }
  if (countCodePoints(title) > CHAT_TITLE_MAX_CODE_POINTS) {
    return {
      valid: false,
      errors: [
        {
          field: "title",
          code: "too-long",
          message: `Chat names must be ${CHAT_TITLE_MAX_CODE_POINTS} characters or fewer.`,
        },
      ],
    };
  }
  return { valid: true, value: title };
}

export function validateMessage(value: string): ValidationResult<string, "message"> {
  if (!value.trim()) {
    return {
      valid: false,
      errors: [{ field: "message", code: "required", message: "Write a message first." }],
    };
  }
  if (countCodePoints(value) > MESSAGE_MAX_CODE_POINTS) {
    return {
      valid: false,
      errors: [
        {
          field: "message",
          code: "too-long",
          message: `Messages must be ${MESSAGE_MAX_CODE_POINTS.toLocaleString()} characters or fewer.`,
        },
      ],
    };
  }
  return { valid: true, value };
}

