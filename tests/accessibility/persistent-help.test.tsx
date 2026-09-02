import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";

import AppView, {
  type AppViewActionProps,
  type AppViewSession,
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
const tokensCss = readFileSync(
  resolve(testDirectory, "../../src/styles/tokens.css"),
  "utf8"
);

const registeredUser: AppUser = {
  kind: "registered",
  uid: "user-qa-009",
  displayName: "Rowan Aldridge",
  email: "rowan@example.com"
};

const guestUser: AppUser = {
  kind: "guest",
  uid: "guest-qa-009",
  displayName: "Guest",
  email: null
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
    chatId: "chat-qa-009",
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
    id: "chat-qa-009",
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
  safetyRegions: [],
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

function getHelpAffordance() {
  return screen.getByRole("region", { name: "Help" });
}

function getHelpTrigger() {
  return within(getHelpAffordance()).getByRole("button", { name: "Help" });
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

describe("persistent help affordance presence", () => {
  const sessionStates: Array<{ label: string; overrides: ViewOverrides }> = [
    { label: "initializing", overrides: { session: "initializing", user: null } },
    { label: "anonymous", overrides: { session: "anonymous", user: null } },
    { label: "registered", overrides: { session: "registered" } },
    { label: "guest (pre-expiry)", overrides: { session: "guest", user: guestUser } },
    {
      label: "guest-expired (post-expiry)",
      overrides: { session: "guest-expired", user: null }
    }
  ];

  for (const state of sessionStates) {
    it(`renders in the ${state.label} session state`, () => {
      renderAppView(state.overrides);
      const affordance = getHelpAffordance();
      expect(affordance).toBeInTheDocument();
      expect(affordance).toHaveAttribute("data-persistent-help", "true");
      expect(getHelpTrigger()).toBeEnabled();
    });
  }

  it("covers every declared session state in this suite", () => {
    const covered = sessionStates.map(
      (state) => (state.overrides.session || "registered") as AppViewSession
    );
    expect(new Set(covered)).toEqual(
      new Set<AppViewSession>([
        "initializing",
        "anonymous",
        "registered",
        "guest",
        "guest-expired"
      ])
    );
  });

  it("renders unchanged for a failed reply, an empty chat, and camera on or off", () => {
    const failureChat = chat([
      message({
        id: "user-failure",
        role: "user",
        status: "complete",
        clientRequestId: "request-failure",
        text: "A synthetic message with no risk language."
      }),
      message({
        id: "assistant-failure",
        role: "assistant",
        status: "failed",
        clientRequestId: "request-failure"
      })
    ]);

    const variants: ViewOverrides[] = [
      { chats: [failureChat], activeChatId: failureChat.id },
      { chats: [chat()], activeChatId: "chat-qa-009" },
      {
        chats: [chat()],
        activeChatId: "chat-qa-009",
        camera: { phase: "on", useEstimate: true, label: "sad", confidenceBand: "medium" }
      },
      {
        chats: [chat()],
        activeChatId: "chat-qa-009",
        camera: { phase: "denied", useEstimate: false, errorReason: "permission-denied" }
      }
    ];

    const rendered: string[] = [];
    for (const overrides of variants) {
      renderAppView(overrides);
      rendered.push(getHelpAffordance().textContent || "");
      cleanup();
    }

    expect(rendered).toHaveLength(variants.length);
    expect(new Set(rendered).size).toBe(1);
    expect(rendered[0]).toContain("Help");
  });

  it("does not depend on the safety router producing a route", () => {
    const unroutedChat = chat([
      message({
        id: "user-unrouted",
        role: "user",
        status: "complete",
        text: "A synthetic message the router did not route."
      }),
      message({
        id: "assistant-unrouted",
        role: "assistant",
        status: "complete",
        text: "A synthetic ordinary reply."
      })
    ]);
    renderAppView({ chats: [unroutedChat], activeChatId: unroutedChat.id });

    expect(
      screen.queryByRole("complementary", { name: /Get help now/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Contact local emergency services/i })
    ).not.toBeInTheDocument();
    expect(getHelpAffordance()).toBeInTheDocument();
    expect(getHelpTrigger()).toBeEnabled();
  });

  it("stays present and distinct while a routed safety response is shown", () => {
    const routedChat = chat([
      message({
        id: "user-routed",
        role: "user",
        status: "complete",
        text: "Synthetic scenario: a user message that was routed to safety support."
      }),
      message({
        id: "assistant-routed",
        role: "assistant",
        status: "complete",
        text: "Please contact local emergency services or someone you trust now.",
        safetySupport: true
      })
    ]);
    renderAppView({ chats: [routedChat], activeChatId: routedChat.id });

    const routedCard = screen.getByRole("complementary", { name: /Get help now/i });
    const affordance = getHelpAffordance();
    expect(routedCard).toBeInTheDocument();
    expect(affordance).toBeInTheDocument();
    expect(routedCard.contains(affordance)).toBe(false);
    expect(affordance.contains(routedCard)).toBe(false);
  });

  it("is a sibling of the session experience and never nested in the shell", () => {
    const { container } = renderAppView({ chats: [chat()], activeChatId: "chat-qa-009" });
    const shell = container.querySelector(".ss-app");
    const affordance = getHelpAffordance();
    expect(shell).toBeInTheDocument();
    expect(shell?.contains(affordance)).toBe(false);
    expect(affordance.parentElement).toBe(shell?.parentElement);
    expect(
      screen.getByRole("link", { name: "Skip to active conversation" })
    ).toBe(shell?.firstElementChild);
  });
});

describe("persistent help affordance operability", () => {
  it("exposes a stable accessible name, role, and collapsed disclosure state", async () => {
    const { container } = renderAppView({ chats: [chat()], activeChatId: "chat-qa-009" });
    const trigger = getHelpTrigger();

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    const panelId = trigger.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const panel = container.querySelector(`#${CSS.escape(panelId!)}`);
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute("hidden");
    expect(getHelpAffordance()).toHaveAttribute("aria-labelledby", trigger.id);
    await expect(axe(container)).resolves.toHaveNoViolations();
  });

  it("is keyboard reachable and opens, dismisses, and recovers without loss", () => {
    renderAppView({ chats: [chat()], activeChatId: "chat-qa-009" });
    const trigger = getHelpTrigger();

    expect(trigger).not.toHaveAttribute("tabindex");
    trigger.focus();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const close = within(getHelpAffordance()).getByRole("button", { name: "Close" });
    expect(close).toBeEnabled();

    fireEvent.click(close);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(
      within(getHelpAffordance()).queryByRole("button", { name: "Close" })
    ).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      within(getHelpAffordance()).getByRole("button", { name: "Close" })
    ).toBeEnabled();
    expect(getHelpTrigger()).toBeInTheDocument();
  });

  it("collapses on Escape and returns focus to the persistent trigger", () => {
    renderAppView({ chats: [chat()], activeChatId: "chat-qa-009" });
    const trigger = getHelpTrigger();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(getHelpAffordance(), { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(getHelpTrigger()).toBeInTheDocument();
  });

  it("has no axe violations while expanded", async () => {
    const { container } = renderAppView({ chats: [chat()], activeChatId: "chat-qa-009" });
    fireEvent.click(getHelpTrigger());
    await expect(axe(container)).resolves.toHaveNoViolations();
  });

  it("invokes no action, records nothing, and touches no storage when opened", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const removeItem = vi.spyOn(Storage.prototype, "removeItem");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderAppView({ chats: [chat()], activeChatId: "chat-qa-009" });

    const trigger = getHelpTrigger();
    fireEvent.click(trigger);
    fireEvent.click(within(getHelpAffordance()).getByRole("button", { name: "Close" }));

    for (const action of Object.values(actions)) {
      expect(action).not.toHaveBeenCalled();
    }
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("remains operable when reduced motion is preferred", () => {
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
    renderAppView({ chats: [chat()], activeChatId: "chat-qa-009" });

    const trigger = getHelpTrigger();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(within(getHelpAffordance()).getByRole("button", { name: "Close" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    const reducedMotionCss = cssBlock(
      appViewCss,
      "@media (prefers-reduced-motion: reduce)"
    );
    expect(reducedMotionCss).toMatch(
      /\.ss-help-affordance__trigger\s*{[^}]*transition:\s*none[^}]*animation:\s*none[^}]*}/s
    );
    expect(appViewCss.indexOf(".ss-help-affordance__trigger {")).toBeLessThan(
      appViewCss.indexOf("@media (prefers-reduced-motion: reduce)")
    );
  });
});

describe("persistent help affordance presentation tokens", () => {
  it("reserves its own layout space instead of overlaying content", () => {
    const reserveToken = tokensCss.match(
      /--help-affordance-space:\s*calc\(([\s\S]*?)\);/
    )?.[1];
    expect(reserveToken).toBeDefined();
    expect(reserveToken).toContain("var(--control-min)");
    expect(reserveToken).toContain("env(safe-area-inset-bottom)");
    const reserveBlock = cssBlock(
      appViewCss,
      ".ss-auth__atmosphere,\n.ss-auth__main {"
    );
    expect(reserveBlock).toMatch(
      /min-height:\s*calc\(100dvh - var\(--help-affordance-space\)\)/
    );
    expect(cssBlock(appViewCss, ".ss-help-affordance {")).toMatch(
      /min-height:\s*var\(--help-affordance-space\)/
    );
  });

  /* jsdom performs no layout, so this cannot observe where the strip renders.
     It is a source pin, not a layout proof: it fails if either declaration
     that real-browser measurement showed to be load-bearing is removed.

     Measured in headless Chrome on the pre-sign-in screen. The reserve above is
     a min-height, so on its own it left the strip below the fold at every
     mobile width -- top 856 against an 844 viewport at 390x844, 918 against 800
     at 320x800, 800 against 800 at 640x800. Sizing the auth screen to the
     reserve and giving it its own scrolling put the strip at 788, 744 and 744,
     inside the viewport at all three, occluding nothing. Whether the strip is
     actually visible on arrival can only be checked in an engine that lays out;
     see docs/qa/TASK-09.md. */
  it("pins the declarations that keep the strip inside the viewport", () => {
    expect(appViewCss).toMatch(
      /\.ss-auth\s*{\s*height:\s*calc\(100dvh - var\(--help-affordance-space\)\);\s*overflow-y:\s*auto;\s*}/
    );

    const affordanceCss = cssBlock(appViewCss, ".ss-help-affordance {");
    expect(affordanceCss).toMatch(/position:\s*sticky/);
    expect(affordanceCss).toMatch(/bottom:\s*0/);
  });

  it("uses boundary and text tokens that meet the contrast targets", () => {
    const controlBorder = cssToken(tokensCss, "--color-control-border");
    const surface = cssToken(tokensCss, "--color-surface");
    const canvas = cssToken(tokensCss, "--color-canvas");
    const textPrimary = cssToken(tokensCss, "--color-text-primary");
    const textSecondary = cssToken(tokensCss, "--color-text-secondary");

    expect(contrastRatio(controlBorder, surface)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(controlBorder, canvas)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(textPrimary, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(textSecondary, surface)).toBeGreaterThanOrEqual(4.5);

    const triggerCss = cssBlock(appViewCss, ".ss-help-affordance__trigger {");
    expect(triggerCss).toMatch(/border:\s*1px solid var\(--color-control-border\)/);
    expect(triggerCss).toMatch(/background:\s*var\(--color-surface\)/);
    expect(triggerCss).toMatch(/color:\s*var\(--color-text-primary\)/);
    expect(triggerCss).toMatch(/min-height:\s*var\(--control-min\)/);

    const closeCss = cssBlock(appViewCss, ".ss-help-affordance__close {");
    expect(closeCss).toMatch(/border:\s*1px solid var\(--color-control-border\)/);
    expect(closeCss).toMatch(/min-height:\s*var\(--control-min\)/);

    const panelTextCss = cssBlock(appViewCss, ".ss-help-affordance__panel p {");
    expect(panelTextCss).toMatch(/color:\s*var\(--color-text-secondary\)/);
  });

  it("does not rely on color, hover, or motion to be understood", () => {
    renderAppView({ chats: [chat()], activeChatId: "chat-qa-009" });
    const trigger = getHelpTrigger();
    expect(trigger).toHaveTextContent("Help");
    expect(trigger.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(1);
    expect(cssBlock(appViewCss, ".ss-help-affordance__panel[hidden]")).toMatch(
      /display:\s*none/
    );
  });
});

describe("persistent help affordance content boundaries", () => {
  function affordanceText() {
    renderAppView({ chats: [chat()], activeChatId: "chat-qa-009" });
    fireEvent.click(getHelpTrigger());
    return getHelpAffordance().textContent || "";
  }

  it("keeps the panel wording pinned to the reviewed shipped safety response", () => {
    // The panel composes its two paragraphs from an already-reviewed responseText
    // rather than introducing new copy. Reading the reviewed source here turns
    // that provenance into a check: if the reviewed copy is reworded, this fails
    // instead of the panel quietly diverging from the wording that was approved.
    //
    // The copy lives in server/safety-policy.json as `persistentHelpText`. The
    // panel deliberately does NOT track the routed responses any more: those name
    // US crisis resources, and this panel is shown to every visitor, including
    // those outside the launch market. Keeping it pinned to its own reviewed,
    // location-neutral string is what lets the neutrality guards below stay
    // strict while the routed copy carries a region-specific number.
    const shippedPolicy = JSON.parse(
      readFileSync(resolve(testDirectory, "../../server/safety-policy.json"), "utf8")
    ) as { persistentHelpText: string };
    const violence = shippedPolicy.persistentHelpText;
    expect(violence).toBeDefined();

    renderAppView({ chats: [chat()], activeChatId: "chat-qa-009" });
    fireEvent.click(getHelpTrigger());
    const paragraphs = Array.from(
      getHelpAffordance().querySelectorAll(".ss-help-affordance__panel p")
    ).map((paragraph) => paragraph.textContent || "");

    expect(paragraphs).toHaveLength(2);
    expect(`${paragraphs[0]} ${paragraphs[1]}`).toBe(violence);
  });

  it("states the non-monitored, non-emergency boundary in reviewed wording", () => {
    const text = affordanceText();
    expect(text).toContain(
      "Emotional Friend is not monitored and cannot provide emergency care."
    );
    expect(text).toContain(
      "If you or someone else may be harmed now, contact local emergency services or move to a safer place with a trusted person nearby."
    );
  });

  it("names no resource, region, service, or contact detail", () => {
    const text = affordanceText();
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(/https?:|www\.|\.org|\.com|\.net/i);
    expect(text).not.toMatch(/@/);
    expect(text).not.toMatch(/hotline|helpline|lifeline|crisis line|text line|dial|call \d|toll[- ]free/i);
    expect(text).not.toMatch(
      /\b(?:United States|United Kingdom|Japan|India|Australia|Canada|Europe|America|NHS|Samaritans|911|999|112|110|119)\b/i
    );
  });

  it("makes no monitoring, rescue, dispatch, or surveillance claim", () => {
    const text = affordanceText();
    expect(text).not.toMatch(/\bwe (?:are|will be)? ?(?:monitor|watch|track)/i);
    expect(text).not.toMatch(/\bis (?:being )?monitored\b/i);
    expect(text).not.toMatch(/\bsomeone (?:is|will be) (?:watching|reviewing|notified|alerted)\b/i);
    expect(text).not.toMatch(/\b(?:help|someone) is on the way\b/i);
    expect(text).not.toMatch(/\bwe (?:have )?(?:alerted|notified|contacted|dispatched|reported)\b/i);
    expect(text).not.toMatch(/\bemergency services (?:have|has) been\b/i);
    expect(text).not.toMatch(/\bwe(?:'ll| will) (?:send|get) (?:help|someone)\b/i);
    expect(text).not.toMatch(/\bstay (?:on the line|with us) (?:and|while)\b/i);
  });

  it("makes no diagnosis, treatment, clinical-certainty, or credential claim", () => {
    const text = affordanceText();
    expect(text).not.toMatch(/\bdiagnos/i);
    expect(text).not.toMatch(/\btreatment\b|\btreat you\b|\bprescri/i);
    expect(text).not.toMatch(/\btherapy\b|\btherapist\b|\bcounsell?or\b|\bclinician\b|\bpsychiatr/i);
    expect(text).not.toMatch(/\blicensed\b|\bcertified\b|\bqualified\b|\bmedical professional\b/i);
    expect(text).not.toMatch(/\byou (?:are|have) (?:depressed|suicidal|at risk|in crisis)\b/i);
    expect(text).not.toMatch(/\bI (?:can tell|noticed|detected|sense|see) (?:that )?you\b/i);
  });

  it("makes no consciousness or confidentiality claim", () => {
    const text = affordanceText();
    expect(text).not.toMatch(/\bI am (?:alive|conscious|real|human|sentient)\b/i);
    expect(text).not.toMatch(/\bI (?:feel|understand exactly|truly know)\b/i);
    expect(text).not.toMatch(/\bconfidential\b|\bprivate and secure\b|\bencrypted\b|\bnever shared\b/i);
    expect(text).not.toMatch(/\bsecret\b|\banonymous\b/i);
  });

  it("does not claim it detected, inferred, or classified anything about the user", () => {
    const text = affordanceText();
    expect(text).not.toMatch(/\bdetect/i);
    expect(text).not.toMatch(/\bwe (?:noticed|saw|found|flagged)\b/i);
    expect(text).not.toMatch(/\bbased on (?:your|what you)\b/i);
    expect(text).not.toMatch(/\byour (?:messages?|expression|camera|face|mood|emotion)\b/i);
    expect(text).not.toMatch(/\bbecause you\b/i);
    expect(text).not.toMatch(/\bthis (?:appeared|opened) because\b/i);
  });

  it("keeps identical content whether or not a safety response is present", () => {
    const plain = affordanceText();
    cleanup();

    const routedChat = chat([
      message({
        id: "user-routed-content",
        role: "user",
        status: "complete",
        text: "Synthetic scenario: a user message that was routed to safety support."
      }),
      message({
        id: "assistant-routed-content",
        role: "assistant",
        status: "complete",
        text: "Please contact local emergency services or someone you trust now.",
        safetySupport: true
      })
    ]);
    renderAppView({ chats: [routedChat], activeChatId: routedChat.id });
    fireEvent.click(getHelpTrigger());

    expect(getHelpAffordance().textContent).toBe(plain);
  });
});
