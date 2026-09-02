import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";

import AppView, {
  type AppViewActionProps,
  type AppViewViewProps,
  type AuthViewState,
  type CameraViewState,
  type GuestViewState
} from "../../src/components/AppView";
import type { AppUser, Chat, Message } from "../../src/types";

expect.extend(toHaveNoViolations);

const testDirectory = dirname(fileURLToPath(import.meta.url));
const appViewCss = readFileSync(
  resolve(testDirectory, "../../src/styles/app-view.css"),
  "utf8"
);
const globalCss = readFileSync(
  resolve(testDirectory, "../../src/styles/global.css"),
  "utf8"
);
const tokensCss = readFileSync(
  resolve(testDirectory, "../../src/styles/tokens.css"),
  "utf8"
);

const registeredUser: AppUser = {
  kind: "registered",
  uid: "user-qa-001",
  displayName: "Rowan Aldridge",
  email: "rowan@example.com"
};

const timestamps = {
  createdAt: "2026-08-09T00:00:00.000Z",
  completedAt: "2026-08-09T00:00:01.000Z"
};

function message(
  overrides: Partial<Message> & Pick<Message, "id" | "role" | "status">
): Message {
  const { id, role, status, ...messageOverrides } = overrides;

  return {
    id,
    chatId: "chat-qa-001",
    role,
    text: "",
    status,
    clientRequestId: `request-${id}`,
    createdAt: timestamps.createdAt,
    completedAt: status === "complete" ? timestamps.completedAt : null,
    emotionContext: null,
    ...messageOverrides
  };
}

function chat(messages: Message[] = []): Chat {
  return {
    id: "chat-qa-001",
    title: "Talking to my manager",
    titleSource: "user",
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.completedAt,
    lastMessageAt: messages.length ? timestamps.completedAt : null,
    messages
  };
}

const actions: AppViewActionProps = {
  onAuthViewChange: vi.fn(),
  onSignIn: vi.fn(),
  onSignUp: vi.fn(),
  onContinueWithGoogle: vi.fn(),
  onRequestPasswordReset: vi.fn(),
  onResendPasswordReset: vi.fn(),
  onStartGuest: vi.fn(),
  onCreateAccountFromGuest: vi.fn(),
  onLeaveGuest: vi.fn(),
  onRestartGuest: vi.fn(),
  onReturnToSignIn: vi.fn(),
  onSignOut: vi.fn(),
  onCreateChat: vi.fn(),
  onSelectChat: vi.fn(),
  onRenameChat: vi.fn(),
  onDeleteChat: vi.fn(),
  onRetryChatList: vi.fn(),
  onRetryMessages: vi.fn(),
  onLoadMoreChats: vi.fn(),
  onLoadOlderMessages: vi.fn(),
  onSendMessage: vi.fn(),
  onRetryMessage: vi.fn(),
  onEditAndResendMessage: vi.fn(),
  onDeleteMessage: vi.fn(),
  onUndoDeleteMessage: vi.fn(),
  onRequestCamera: vi.fn(),
  onCancelCamera: vi.fn(),
  onRetryCamera: vi.fn(),
  onStopCamera: vi.fn(),
  onSetUseEstimate: vi.fn(),
  onEmergencyHelp: vi.fn(),
  onSelectSafetyRegion: vi.fn()
};

const baseView: AppViewViewProps = {
  session: "registered",
  auth: { kind: "sign-in" },
  user: registeredUser,
  chats: [],
  activeChatId: null,
  deletingChatIds: [],
  chatListStatus: "ready",
  messageListStatus: "ready",
  camera: { phase: "off", useEstimate: false },
  connectionStatus: "online",
  safetyRegions: [
    { code: "GB", label: "United Kingdom" },
    { code: "IE", label: "Ireland" }
  ],
  selectedSafetyRegion: null,
  privacyHref: "/privacy",
  termsHref: "/terms"
};

type ViewOverrides = Omit<
  Partial<AppViewViewProps>,
  "auth" | "camera" | "guest"
> & {
  auth?: Partial<AuthViewState>;
  camera?: Partial<CameraViewState>;
  guest?: Partial<GuestViewState>;
};

function createView(overrides: ViewOverrides = {}): AppViewViewProps {
  const {
    auth: authOverrides,
    camera: cameraOverrides,
    guest: guestOverrides,
    ...viewOverrides
  } = overrides;
  return {
    ...baseView,
    ...viewOverrides,
    auth: { ...baseView.auth, ...authOverrides },
    camera: { ...baseView.camera, ...cameraOverrides },
    guest: guestOverrides
      ? { ...baseView.guest, ...guestOverrides }
      : baseView.guest
  };
}

function renderAppView(overrides: ViewOverrides = {}) {
  return render(<AppView view={createView(overrides)} actions={actions} />);
}

async function expectNoAxeViolations(container: HTMLElement) {
  expect(await axe(container)).toHaveNoViolations();
}

function getReplyStatus() {
  const status = screen
    .getByText(/Writing a reply/i)
    .closest<HTMLElement>('[role="status"]');
  if (!status) throw new Error("Missing reply progress status");
  return status;
}

function getFailedReplyAlert() {
  const alert = screen.getAllByRole("alert").find((candidate) =>
    within(candidate).queryByRole("button", { name: /Try again/i })
  );
  if (!alert) throw new Error("Missing failed reply alert");
  return alert;
}

function cssBlock(source: string, marker: string) {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing CSS block ${marker}`);
  const openingBrace = source.indexOf("{", start);
  if (openingBrace < 0) throw new Error(`Missing opening brace for ${marker}`);
  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Missing closing brace for ${marker}`);
}

function cssToken(source: string, name: string) {
  const match = source.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!match) throw new Error(`Missing CSS token ${name}`);
  return match[1]!;
}

function relativeLuminance(hex: string) {
  const channels = hex.match(/[0-9a-f]{2}/gi);
  if (!channels || channels.length !== 3) throw new Error(`Invalid color ${hex}`);
  const values = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0]! + 0.7152 * values[1]! + 0.0722 * values[2]!;
}

function contrastRatio(first: string, second: string) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

beforeAll(() => {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
    window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
  }
  if (!Element.prototype.scrollTo) {
    Object.defineProperty(Element.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
      writable: true
    });
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("AppView rendered accessibility", () => {
  it("renders the welcome/sign-in experience without axe violations", async () => {
    const { container } = renderAppView({
      session: "anonymous",
      user: null,
      auth: {
        kind: "sign-in",
        fieldErrors: { email: "Enter a complete email address." },
        formError: "That email and password do not match."
      }
    });

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toHaveAccessibleDescription(
      "Enter a complete email address."
    );
    expect(screen.getByLabelText(/Password/i)).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
    expect(screen.getByRole("button", { name: /Continue with Google/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Try demo mode/i })).toBeEnabled();
    const alerts = screen.getAllByRole("alert");
    expect(
      alerts.some((alert) =>
        alert.textContent?.includes("That email and password do not match.")
      )
    ).toBe(true);
    expect(
      alerts.some(
        (alert) =>
          alert.getAttribute("aria-live") === "assertive" &&
          alert.textContent?.includes("Enter a complete email address.")
      )
    ).toBe(true);
    expect(screen.getAllByRole("link", { name: /Privacy/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Terms/i }).length).toBeGreaterThan(0);
    await expectNoAxeViolations(container);
  });

  it("renders a registered empty chat with named navigation and main landmarks", async () => {
    const emptyChat = chat();
    const { container } = renderAppView({
      chats: [emptyChat],
      activeChatId: emptyChat.id
    });

    expect(
      screen.getByRole("complementary", { name: "Conversation navigation" })
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Conversations" })).toBeInTheDocument();
    expect(
      screen.getByRole("main", { name: "Active conversation" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /What would you like to talk through/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Write what’s on your mind/i)).toBeEnabled();
    expect(screen.getByRole("button", { name: /Send message/i })).toBeDisabled();
    await expectNoAxeViolations(container);
  });

  it("places a keyboard bypass before repeated navigation and moves focus to the conversation", () => {
    const activeChat = chat();
    const { container } = renderAppView({
      chats: [activeChat],
      activeChatId: activeChat.id
    });

    const bypass = screen.getByRole("link", { name: "Skip to active conversation" });
    const shell = container.querySelector(".ss-app");
    const conversation = screen.getByRole("main", { name: "Active conversation" });
    expect(shell?.firstElementChild).toBe(bypass);
    expect(bypass).toHaveAttribute("href", "#active-conversation");
    expect(conversation).toHaveAttribute("id", "active-conversation");

    fireEvent.click(bypass);
    expect(conversation).toHaveFocus();
  });

  it("does not add the conversation bypass outside the chat application shell", () => {
    renderAppView({ session: "anonymous", user: null });
    expect(
      screen.queryByRole("link", { name: "Skip to active conversation" })
    ).not.toBeInTheDocument();
  });

  it("renders active safety, pending, and failed messages with complete live content", async () => {
    const activeChat = chat([
      message({
        id: "user-risk",
        role: "user",
        status: "complete",
        text: "Synthetic scenario: a user message that was routed to safety support."
      }),
      message({
        id: "assistant-safety",
        role: "assistant",
        status: "complete",
        text: "Please contact local emergency services or someone you trust now.",
        safetySupport: true
      }),
      message({
        id: "assistant-failed",
        role: "assistant",
        status: "failed"
      }),
      message({
        id: "assistant-pending",
        role: "assistant",
        status: "pending"
      })
    ]);
    const { container } = renderAppView({
      chats: [activeChat],
      activeChatId: activeChat.id
    });

    expect.soft(screen.queryByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("log", { name: "Conversation messages" })
    ).toBeInTheDocument();
    const replyStatus = getReplyStatus();
    expect(replyStatus).toHaveTextContent(/Writing a reply/i);
    expect(replyStatus).not.toHaveAttribute("aria-label");
    expect(replyStatus).toHaveAttribute("aria-atomic", "true");
    expect(replyStatus).toHaveAttribute("data-motion", "animated");
    const progressGraphic = replyStatus.querySelector('[aria-hidden="true"]');
    expect(progressGraphic).toBeInTheDocument();
    expect(progressGraphic?.firstElementChild).toHaveClass(
      "ss-reply-indicator__progress-fill--animated"
    );
    expect(replyStatus.querySelector("i")).not.toBeInTheDocument();
    const failure = getFailedReplyAlert();
    expect(failure).not.toHaveAttribute("aria-label");
    expect(failure).toHaveAttribute("aria-atomic", "true");
    const failureTitle = failure.querySelector("strong");
    expect(failureTitle).toBeInTheDocument();
    expect(failureTitle).not.toBeEmptyDOMElement();
    const failureBody = failure.querySelector("p");
    expect(failureBody).toBeInTheDocument();
    expect(failureBody).not.toBeEmptyDOMElement();
    expect(within(failure).getByRole("button", { name: /Try again/i })).toBeEnabled();
    expect(
      screen.getByRole("complementary", { name: /Get help now/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Contact local emergency services/i })
    ).toBeEnabled();
    await expectNoAxeViolations(container);
  });

  it("uses the visible reply indicator as the single writing announcement source", async () => {
    const clientRequestId = "request-single-writing-status";
    const userMessage = message({
      id: "user-single-writing-status",
      role: "user",
      status: "complete",
      clientRequestId,
      text: "A synthetic request before reply progress."
    });
    const activeChat = chat([userMessage]);
    const { rerender } = render(
      <AppView
        view={createView({ chats: [activeChat], activeChatId: activeChat.id })}
        actions={actions}
      />
    );

    const pendingReply = message({
      id: "assistant-single-writing-status",
      role: "assistant",
      status: "pending",
      clientRequestId
    });
    rerender(
      <AppView
        view={createView({
          chats: [chat([userMessage, pendingReply])],
          activeChatId: activeChat.id
        })}
        actions={actions}
      />
    );

    await waitFor(() => {
      const writingStatuses = screen.getAllByRole("status").filter((status) =>
        /Writing a reply/i.test(status.textContent || "")
      );
      expect(writingStatuses).toEqual([getReplyStatus()]);
    });
  });

  it("keeps failed replies adjacent to their affected user message with retry and edit", async () => {
    const clientRequestId = "request-adjacent-failure";
    const failedReply = message({
      id: "assistant-adjacent-failure",
      role: "assistant",
      status: "failed",
      clientRequestId
    });
    const userMessage = message({
      id: "user-adjacent-failure",
      role: "user",
      status: "complete",
      clientRequestId,
      text: "I need a moment to reset."
    });
    const activeChat = chat([failedReply, userMessage]);
    renderAppView({
      chats: [activeChat],
      activeChatId: activeChat.id
    });

    const userRow = screen.getByText(userMessage.text).closest("li");
    const failure = getFailedReplyAlert();
    const failureRow = failure.closest("li");
    expect(userRow?.nextElementSibling).toBe(failureRow);

    fireEvent.click(within(failure).getByRole("button", { name: /Try again/i }));
    expect(actions.onRetryMessage).toHaveBeenCalledWith(failedReply);

    fireEvent.click(within(failure).getByRole("button", { name: /Edit/i }));
    const editDialog = screen.getByRole("dialog");
    expect(editDialog).toBeInTheDocument();
    expect(within(editDialog).getByRole("textbox")).toHaveValue(userMessage.text);
    await expectNoAxeViolations(editDialog);
  });

  it("keeps a request-paired pending indicator in place when it becomes retryable", () => {
    const clientRequestId = "request-stable-reply-state";
    const userMessage = message({
      id: "user-stable-reply-state",
      role: "user",
      status: "complete",
      clientRequestId,
      text: "A synthetic request awaiting a reply."
    });
    const pendingReply = message({
      id: "assistant-stable-reply-state",
      role: "assistant",
      status: "pending",
      clientRequestId
    });
    const { rerender } = render(
      <AppView
        view={createView({
          chats: [chat([pendingReply, userMessage])],
          activeChatId: "chat-qa-001"
        })}
        actions={actions}
      />
    );

    const userRow = screen.getByText(userMessage.text).closest("li");
    const pendingRow = getReplyStatus().closest("li");
    expect(userRow?.nextElementSibling).toBe(pendingRow);

    const failedReply = { ...pendingReply, status: "failed" as const };
    rerender(
      <AppView
        view={createView({
          chats: [chat([failedReply, userMessage])],
          activeChatId: "chat-qa-001"
        })}
        actions={actions}
      />
    );

    const failure = getFailedReplyAlert();
    expect(screen.getByText(userMessage.text).closest("li")?.nextElementSibling).toBe(
      failure.closest("li")
    );
    fireEvent.click(within(failure).getByRole("button", { name: /Try again/i }));
    expect(actions.onRetryMessage).toHaveBeenCalledWith(failedReply);
  });

  it("keeps a request-paired completed reply after its user on the same mounted rerender", () => {
    const clientRequestId = "request-stable-completion";
    const userMessage = message({
      id: "user-stable-completion",
      role: "user",
      status: "complete",
      clientRequestId,
      text: "A synthetic request awaiting completion."
    });
    const pendingReply = message({
      id: "assistant-stable-completion",
      role: "assistant",
      status: "pending",
      clientRequestId
    });
    const { rerender } = render(
      <AppView
        view={createView({
          chats: [chat([pendingReply, userMessage])],
          activeChatId: "chat-qa-001"
        })}
        actions={actions}
      />
    );

    expect(screen.getByText(userMessage.text).closest("li")?.nextElementSibling).toBe(
      getReplyStatus().closest("li")
    );

    const completedReply = {
      ...pendingReply,
      status: "complete" as const,
      text: "A synthetic completed reply."
    };
    rerender(
      <AppView
        view={createView({
          chats: [chat([completedReply, userMessage])],
          activeChatId: "chat-qa-001"
        })}
        actions={actions}
      />
    );

    expect(screen.getByText(userMessage.text).closest("li")?.nextElementSibling).toBe(
      screen.getByText(completedReply.text).closest("li")
    );
  });

  it("retains the legacy edit association when a failed reply has no request id", () => {
    const userMessage = message({
      id: "user-legacy-failure",
      role: "user",
      status: "complete",
      clientRequestId: "",
      text: "A synthetic legacy message."
    });
    const legacyFailure = message({
      id: "assistant-legacy-failure",
      role: "assistant",
      status: "failed",
      clientRequestId: ""
    });
    renderAppView({
      chats: [chat([userMessage, legacyFailure])],
      activeChatId: "chat-qa-001"
    });

    const failure = getFailedReplyAlert();
    fireEvent.click(within(failure).getByRole("button", { name: /Edit/i }));
    expect(within(screen.getByRole("dialog")).getByRole("textbox")).toHaveValue(
      userMessage.text
    );
  });

  it("keeps a failed reply with its adjacent deleted request owner", () => {
    const clientRequestId = "request-deleted-owner";
    const failedReply = message({
      id: "assistant-deleted-owner",
      role: "assistant",
      status: "failed",
      clientRequestId
    });
    const deletedUser = message({
      id: "user-deleted-owner",
      role: "user",
      status: "deleted",
      clientRequestId,
      text: ""
    });
    renderAppView({
      chats: [chat([failedReply, deletedUser])],
      activeChatId: "chat-qa-001"
    });

    const failure = getFailedReplyAlert();
    expect(failure.closest("li")?.previousElementSibling).toHaveTextContent(/deleted/i);
    expect(within(failure).queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps distant reused request ids anchored while pairing the adjacent turn", () => {
    const reusedRequestId = "request-reused-distant";
    const currentRequestId = "request-current-adjacent";
    const oldUser = message({
      id: "user-reused-distant",
      role: "user",
      status: "complete",
      clientRequestId: reusedRequestId,
      text: "An older synthetic turn."
    });
    const currentReply = message({
      id: "assistant-current-adjacent",
      role: "assistant",
      status: "complete",
      clientRequestId: currentRequestId,
      text: "A current synthetic reply."
    });
    const currentUser = message({
      id: "user-current-adjacent",
      role: "user",
      status: "complete",
      clientRequestId: currentRequestId,
      text: "A current synthetic turn."
    });
    const distantFailure = message({
      id: "assistant-reused-distant",
      role: "assistant",
      status: "failed",
      clientRequestId: reusedRequestId
    });
    renderAppView({
      chats: [chat([oldUser, currentReply, currentUser, distantFailure])],
      activeChatId: "chat-qa-001"
    });

    const currentUserRow = screen.getByText(currentUser.text).closest("li");
    const currentReplyRow = screen.getByText(currentReply.text).closest("li");
    const failure = getFailedReplyAlert();
    const messageRows = screen
      .getByRole("log", { name: "Conversation messages" })
      .querySelectorAll(".ss-message-row");
    expect(currentUserRow?.nextElementSibling).toBe(currentReplyRow);
    expect(messageRows.item(messageRows.length - 1)).toBe(failure.closest("li"));
    expect(within(failure).queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
  });

  it("does not associate an unmatched failure with an unrelated user message", () => {
    const failedReply = message({
      id: "assistant-unmatched-failure",
      role: "assistant",
      status: "failed",
      clientRequestId: "request-unmatched-failure"
    });
    const unrelatedUser = message({
      id: "user-unrelated",
      role: "user",
      status: "complete",
      clientRequestId: "request-unrelated-user",
      text: "This is a separate synthetic message."
    });
    const activeChat = chat([failedReply, unrelatedUser]);
    renderAppView({ chats: [activeChat], activeChatId: activeChat.id });

    const failure = getFailedReplyAlert();
    expect(within(failure).queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
    expect(failure.closest("li")?.nextElementSibling).toBe(
      screen.getByText(unrelatedUser.text).closest("li")
    );
  });

  it("bounds neutral reply progress and keeps reduced motion static", () => {
    expect(appViewCss).not.toContain("ss-reply-indicator__dots");
    expect(appViewCss).not.toContain("ss-fade-dot");
    const animatedProgressCss = cssBlock(
      appViewCss,
      ".ss-reply-indicator__progress-fill--animated"
    );
    const finiteAnimation = animatedProgressCss.match(
      /animation:\s*ss-reply-progress\s+([\d.]+)s\s+ease-in-out\s+(\d+)\s+forwards/
    );
    if (!finiteAnimation) throw new Error("Reply progress animation is not finitely bounded");
    expect(Number(finiteAnimation[1]) * Number(finiteAnimation[2])).toBeLessThanOrEqual(5);
    expect(animatedProgressCss).not.toContain("infinite");
    expect(cssBlock(appViewCss, "@keyframes ss-reply-progress")).toMatch(
      /100%\s*{[^}]*transform:\s*none[^}]*}/s
    );

    const reducedMotionCss = cssBlock(
      appViewCss,
      "@media (prefers-reduced-motion: reduce)"
    );
    expect(reducedMotionCss).toMatch(
      /\.ss-reply-indicator__progress-fill--animated\s*{[^}]*width:\s*100%[^}]*animation:\s*none[^}]*transform:\s*none[^}]*}/s
    );

    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true)
    }));

    const clientRequestId = "request-reduced-motion";
    const userMessage = message({
      id: "user-reduced-motion",
      role: "user",
      status: "complete",
      clientRequestId,
      text: "A synthetic reduced-motion request."
    });
    const pendingReply = message({
      id: "assistant-reduced-motion",
      role: "assistant",
      status: "pending",
      clientRequestId
    });
    const pendingChat = chat([userMessage, pendingReply]);
    const { rerender } = render(
      <AppView
        view={createView({ chats: [pendingChat], activeChatId: pendingChat.id })}
        actions={actions}
      />
    );
    const conversation = screen.getByRole("main", { name: "Active conversation" });
    const replyStatus = getReplyStatus();
    expect(replyStatus).toHaveAttribute("data-motion", "static");
    expect(replyStatus).not.toHaveAttribute("aria-label");
    expect(replyStatus).toHaveTextContent(/Writing a reply/i);
    expect(
      replyStatus.querySelector(".ss-reply-indicator__progress-fill")
    ).not.toHaveClass("ss-reply-indicator__progress-fill--animated");

    const completedReply = {
      ...pendingReply,
      status: "complete" as const,
      text: "A completed synthetic reply.",
      completedAt: timestamps.completedAt
    };
    const settledChat = chat([userMessage, completedReply]);
    rerender(
      <AppView
        view={createView({ chats: [settledChat], activeChatId: settledChat.id })}
        actions={actions}
      />
    );
    expect(screen.getByRole("main", { name: "Active conversation" })).toBe(conversation);
    expect(screen.queryByText(/Writing a reply/i)).not.toBeInTheDocument();
    expect(screen.getByText(completedReply.text)).toBeInTheDocument();
  });

  it("uses a three-to-one control boundary token without weakening focus", () => {
    const controlBorder = cssToken(tokensCss, "--color-control-border");
    const adjacentSurfaces = [
      cssToken(tokensCss, "--color-surface"),
      cssToken(tokensCss, "--color-surface-raised"),
      cssToken(tokensCss, "--color-canvas"),
      cssToken(tokensCss, "--color-canvas-tint")
    ];
    for (const surface of adjacentSurfaces) {
      expect(contrastRatio(controlBorder, surface)).toBeGreaterThanOrEqual(3);
    }

    expect(appViewCss).toMatch(
      /\.ss-button--secondary\s*{[^}]*border-color:\s*var\(--color-control-border\)/s
    );
    expect(appViewCss).toMatch(
      /\.ss-field__control,[\s\S]*?\.ss-region-selector select\s*{[^}]*border:\s*1px solid var\(--color-control-border\)/s
    );
    expect(appViewCss).toMatch(
      /\.ss-composer\s*{[^}]*border:\s*1px solid var\(--color-control-border\)/s
    );
    expect(appViewCss).toMatch(
      /\.ss-return-latest\s*{[^}]*border:\s*1px solid var\(--color-control-border\)/s
    );
    expect(appViewCss).toMatch(
      /\.ss-toggle::before\s*{[^}]*background:\s*var\(--color-control-border\)/s
    );
    expect(appViewCss).toMatch(
      /\.ss-status-chip\s*{[^}]*border:\s*1px solid var\(--color-control-border\)/s
    );
    expect(appViewCss).toMatch(
      /\.ss-status-chip--success\s*{[^}]*border-color:\s*var\(--color-control-border\)/s
    );
    expect(appViewCss).toMatch(
      /\.ss-status-chip--warning\s*{[^}]*border-color:\s*var\(--color-control-border\)/s
    );
    expect(appViewCss).toMatch(
      /\.ss-camera-state-chip\s*{[^}]*border:\s*1px solid var\(--color-control-border\)/s
    );
    expect(appViewCss).toMatch(
      /\.ss-camera-state-chip--on\s*{[^}]*border-color:\s*var\(--color-control-border\)/s
    );
    expect(appViewCss).toMatch(
      /\.ss-camera-state-chip--warning\s*{[^}]*border-color:\s*var\(--color-control-border\)/s
    );
    expect(
      contrastRatio(controlBorder, cssToken(tokensCss, "--color-mint-soft"))
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(controlBorder, cssToken(tokensCss, "--color-amber-soft"))
    ).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(controlBorder, cssToken(tokensCss, "--color-canvas-tint")))
      .toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(
        cssToken(tokensCss, "--color-primary"),
        cssToken(tokensCss, "--color-canvas-tint")
      )
    ).toBeGreaterThanOrEqual(3);
    expect(cssToken(tokensCss, "--color-focus")).toBe("#4e2bc5");
    expect(globalCss).toMatch(
      /:focus-visible\s*{[^}]*outline:\s*2px solid var\(--color-focus\)[^}]*outline-offset:\s*2px/s
    );
    expect(appViewCss).toMatch(
      /\.ss-conversation\s*{[^}]*position:\s*relative[^}]*isolation:\s*isolate/s
    );
    expect(appViewCss).toMatch(
      /\.ss-conversation:focus\s*{[^}]*outline:\s*none/s
    );
    expect(appViewCss).toMatch(
      /\.ss-conversation:focus::after\s*{[^}]*inset:\s*2px[^}]*z-index:\s*4[^}]*border:\s*2px solid var\(--color-focus\)[^}]*pointer-events:\s*none/s
    );
    expect(appViewCss).toMatch(
      /\.ss-expired__card h1:focus\s*{[^}]*outline:\s*2px solid var\(--color-focus\)[^}]*outline-offset:\s*4px/s
    );
  });

  it("renders the active camera dialog with a named preview and switch", async () => {
    const activeChat = chat([
      message({
        id: "user-camera",
        role: "user",
        status: "complete",
        text: "Today has been better."
      })
    ]);
    renderAppView({
      chats: [activeChat],
      activeChatId: activeChat.id,
      camera: {
        phase: "on",
        useEstimate: true,
        label: "sad",
        confidenceBand: "medium"
      }
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Estimated expression: Sad/i })[0]
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Expression context"
    });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText("Local camera preview")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", {
        name: /Use this estimate to adjust reply tone/i
      })
    ).toBeChecked();
    await expectNoAxeViolations(dialog);
  });

  it("renders a message-list error as an assertive, retryable state", async () => {
    const activeChat = chat();
    const { container } = renderAppView({
      chats: [activeChat],
      activeChatId: activeChat.id,
      messageListStatus: "error",
      messageListError: "Couldn’t load this conversation."
    });

    expect.soft(screen.queryByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Couldn’t load this conversation." })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Try again/i })).toBeEnabled();
    expect(
      screen.getAllByRole("alert").some((alert) =>
        alert.textContent?.includes("Couldn’t load this conversation.")
      )
    ).toBe(true);
    await expectNoAxeViolations(container);
  });

  it("moves focus to the guest-expiry explanation and exposes the transition as status", async () => {
    const activeChat = chat();
    const guestUser: AppUser = {
      kind: "guest",
      uid: "guest-qa-001",
      displayName: "Guest",
      email: null
    };
    const { container, rerender } = render(
      <AppView
        view={createView({
          session: "guest",
          user: guestUser,
          chats: [activeChat],
          activeChatId: activeChat.id
        })}
        actions={actions}
      />
    );
    const persistentStatus = container.querySelector('[data-session-status="true"]');
    expect(persistentStatus).toBeInTheDocument();
    expect(persistentStatus).toBeEmptyDOMElement();
    screen.getByLabelText(/Write what’s on your mind/i).focus();

    rerender(
      <AppView
        view={createView({
          session: "guest-expired",
          user: null,
          chats: [],
          activeChatId: null
        })}
        actions={actions}
      />
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    const title = screen.getByRole("heading", { name: /Your demo session ended/i });
    const body = title.nextElementSibling;
    expect(body?.tagName).toBe("P");
    const status = persistentStatus;
    expect(title).toHaveFocus();
    expect(status).toHaveAttribute("role", "status");
    expect(status).not.toHaveAttribute("aria-label");
    await waitFor(() => {
      expect(status).not.toHaveTextContent(title.textContent || "");
      expect(status).toHaveTextContent(body?.textContent || "");
      expect(status).toHaveTextContent(/camera/i);
    });
    expect(screen.getByRole("button", { name: /Create an account/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Start another demo/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Back to sign in/i })).toBeEnabled();
    await expectNoAxeViolations(container);
  });
});
