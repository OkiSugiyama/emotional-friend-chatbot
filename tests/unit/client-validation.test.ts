import { describe, expect, it } from "vitest";
import {
  countCodePoints,
  validateChatTitle,
  validateMessage,
  validateSignUp,
} from "../../src/domain/validation";

describe("client validation", () => {
  it("counts Unicode code points rather than UTF-16 units", () => {
    expect(countCodePoints("a😀b")).toBe(3);
  });

  it("normalizes sign-up fields and enforces the fixed limits", () => {
    const valid = validateSignUp({
      displayName: "  Rowan  ",
      email: " rowan@example.com ",
      password: "password",
      confirmation: "password",
    });
    expect(valid).toEqual({
      valid: true,
      value: { displayName: "Rowan", email: "rowan@example.com", password: "password" },
    });

    const invalid = validateSignUp({
      displayName: "x".repeat(81),
      email: "rowan@example",
      password: "short",
      confirmation: "different",
    });
    expect(invalid.valid).toBe(false);
    if (!invalid.valid) {
      expect(invalid.errors.map((error) => error.field)).toEqual([
        "displayName",
        "email",
        "password",
        "confirmation",
      ]);
    }
  });

  it("trims titles but preserves valid message whitespace and line breaks", () => {
    expect(validateChatTitle("  A title  ")).toEqual({ valid: true, value: "A title" });
    expect(validateMessage("  first\nsecond  ")).toEqual({
      valid: true,
      value: "  first\nsecond  ",
    });
    expect(validateMessage(" \n\t ").valid).toBe(false);
    expect(validateMessage("x".repeat(8_001)).valid).toBe(false);
  });
});

