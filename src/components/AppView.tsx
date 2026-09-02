import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes
} from "react";
import {
  AlertCircle,
  ArrowDown,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Ellipsis,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  VideoOff,
  X
} from "lucide-react";
import type {
  AppUser,
  Chat,
  ConfidenceBand,
  ExpressionLabel,
  Message
} from "../types";
import { copy } from "../copy";
import "../styles/tokens.css";
import "../styles/global.css";
import "../styles/app-view.css";

type ActionResult = void | Promise<void>;

export type AppViewSession =
  | "initializing"
  | "anonymous"
  | "registered"
  | "guest"
  | "guest-expired";

export type AuthViewKind =
  | "sign-in"
  | "sign-up"
  | "reset-request"
  | "reset-confirmation";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export type CameraPhase =
  | "off"
  | "consent"
  | "model-loading"
  | "permission-pending"
  | "on"
  | "denied"
  | "unavailable"
  | "no-face";

export type CameraErrorReason =
  | "permission-denied"
  | "no-device"
  | "in-use"
  | "unsupported"
  | "insecure-context"
  | "model-load"
  | "inference"
  | "unknown";

export type AuthFieldName =
  | "displayName"
  | "email"
  | "password"
  | "confirmPassword";

export interface AuthViewState {
  kind: AuthViewKind;
  isSubmitting?: boolean;
  isGooglePending?: boolean;
  fieldErrors?: Partial<Record<AuthFieldName, string>>;
  formError?: string | null;
  resetEmail?: string | null;
}

export interface CameraViewState {
  phase: CameraPhase;
  useEstimate: boolean;
  label?: ExpressionLabel | null;
  confidenceBand?: ConfidenceBand | null;
  loadingProgress?: number | null;
  errorReason?: CameraErrorReason | null;
  errorMessage?: string | null;
  previewRef?: Ref<HTMLVideoElement>;
}

export interface GuestViewState {
  storageWarning?: string | null;
}

export interface SafetyRegionOption {
  code: string;
  label: string;
}

export interface AppViewViewProps {
  session: AppViewSession;
  auth: AuthViewState;
  user: AppUser | null;
  chats: Chat[];
  activeChatId: string | null;
  deletingChatIds: readonly string[];
  chatListStatus?: LoadStatus;
  messageListStatus?: LoadStatus;
  chatListError?: string | null;
  messageListError?: string | null;
  hasMoreChats?: boolean;
  isLoadingMoreChats?: boolean;
  hasOlderMessages?: boolean;
  isLoadingOlderMessages?: boolean;
  camera: CameraViewState;
  guest?: GuestViewState;
  connectionStatus?: "online" | "reconnecting" | "offline";
  safetyRegions?: SafetyRegionOption[];
  selectedSafetyRegion?: string | null;
  privacyHref?: string;
  termsHref?: string;
  authControls?: ReactNode;
  accountControls?: ReactNode;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload extends SignInPayload {
  displayName: string | null;
  confirmPassword: string;
}

export interface SendMessagePayload {
  chatId: string;
  text: string;
}

export interface AppViewActionProps {
  onAuthViewChange: (view: AuthViewKind) => ActionResult;
  onSignIn: (payload: SignInPayload) => ActionResult;
  onSignUp: (payload: SignUpPayload) => ActionResult;
  onContinueWithGoogle: () => ActionResult;
  onRequestPasswordReset: (email: string) => ActionResult;
  onResendPasswordReset: (email: string) => ActionResult;
  onStartGuest: () => ActionResult;
  onCreateAccountFromGuest: () => ActionResult;
  onLeaveGuest: () => ActionResult;
  onRestartGuest: () => ActionResult;
  onReturnToSignIn: () => ActionResult;
  onSignOut: () => ActionResult;
  onCreateChat: () => ActionResult;
  onSelectChat: (chatId: string) => ActionResult;
  onRenameChat: (chatId: string, title: string) => ActionResult;
  onDeleteChat: (chatId: string) => ActionResult;
  onRetryChatList: () => ActionResult;
  onRetryMessages: (chatId: string) => ActionResult;
  onLoadMoreChats?: () => ActionResult;
  onLoadOlderMessages?: (chatId: string) => ActionResult;
  onSendMessage: (payload: SendMessagePayload) => ActionResult;
  onRetryMessage: (message: Message) => ActionResult;
  onEditAndResendMessage: (message: Message, text: string) => ActionResult;
  onDeleteMessage: (message: Message) => ActionResult;
  onUndoDeleteMessage?: (message: Message) => ActionResult;
  onRequestCamera: () => ActionResult;
  onCancelCamera: () => ActionResult;
  onRetryCamera: () => ActionResult;
  onStopCamera: () => ActionResult;
  onSetUseEstimate: (enabled: boolean) => ActionResult;
  onEmergencyHelp: () => ActionResult;
  onSelectSafetyRegion: (region: string) => ActionResult;
}

export interface AppViewProps {
  view: AppViewViewProps;
  actions: AppViewActionProps;
}

type DialogState =
  | { kind: "none" }
  | { kind: "rename-chat"; chat: Chat }
  | { kind: "delete-chat"; chat: Chat }
  | { kind: "delete-message"; message: Message }
  | { kind: "edit-message"; message: Message }
  | { kind: "leave-guest" }
  | { kind: "sign-out" };

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function invoke(action: () => ActionResult) {
  void Promise.resolve(action()).catch(() => undefined);
}

function codePointLength(value: string) {
  return Array.from(value).length;
}

function limitCodePoints(value: string, limit: number) {
  return Array.from(value).slice(0, limit).join("");
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function displayExpression(label?: ExpressionLabel | null) {
  if (!label || label === "unavailable") return "Unavailable";
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function displayConfidence(band?: ConfidenceBand | null) {
  if (!band) return "Moderate";
  return band.charAt(0).toUpperCase() + band.slice(1);
}

function initialsFor(user: AppUser | null) {
  const source = user?.displayName?.trim() || user?.email?.trim() || "Guest";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function chatMeta(chat: Chat) {
  const dateValue = chat.lastMessageAt || chat.updatedAt;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return `${chat.messages.length} ${chat.messages.length === 1 ? "message" : "messages"}`;
  }
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const formatted = sameDay
    ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date)
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
  return chat.messages.length > 0
    ? `${chat.messages.length} ${chat.messages.length === 1 ? "message" : "messages"} · ${formatted}`
    : formatted;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  returnFocusRef?: { current: HTMLElement | null }
) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;
    const previous = returnFocusRef?.current || (document.activeElement as HTMLElement | null);
    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("hidden"));
    const first = container.querySelector<HTMLElement>("[data-autofocus]") || focusables()[0];
    const frame = window.requestAnimationFrame(() => first?.focus());

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!container.contains(document.activeElement)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) {
        event.preventDefault();
        container.focus();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      window.requestAnimationFrame(() => previous?.focus());
    };
  }, [active, containerRef, returnFocusRef]);
}

interface OverlayProps {
  open: boolean;
  titleId: string;
  className?: string;
  modal?: boolean;
  trapFocus?: boolean;
  onClose: () => void;
  returnFocusRef?: { current: HTMLElement | null };
  children: ReactNode;
}

function Overlay({ open, titleId, className, modal = true, trapFocus = true, onClose, returnFocusRef, children }: OverlayProps) {
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(open && trapFocus, panelRef, onClose, returnFocusRef);
  if (!open) return null;
  return (
    <div className={cx("ss-overlay", className)}>
      <button
        className="ss-overlay__backdrop"
        type="button"
        aria-label={copy.common.close}
        onClick={onClose}
      />
      <section
        ref={panelRef}
        className="ss-overlay__panel"
        role="dialog"
        aria-modal={modal ? "true" : undefined}
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cx("ss-brand", compact && "ss-brand--compact")}>
      <span className="ss-brand__mark" aria-hidden="true">
        <img src="/brand-mark.svg" alt="" />
      </span>
      <span className="ss-brand__name">{copy.brand.name}</span>
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  busy?: boolean;
  full?: boolean;
}

function Button({ variant = "primary", busy = false, full = false, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cx("ss-button", `ss-button--${variant}`, full && "ss-button--full", className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy && <LoaderCircle className="ss-spin" size={18} aria-hidden="true" />}
      {children}
    </button>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  error?: string;
  hint?: string;
}

function Field({ label, error, hint, id: providedId, className, ...props }: FieldProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const descriptionId = `${id}-description`;
  return (
    <label className={cx("ss-field", className)} htmlFor={id}>
      <span className="ss-field__label">{label}</span>
      <input
        id={id}
        className={cx("ss-field__control", error && "ss-field__control--error")}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? descriptionId : undefined}
        {...props}
      />
      {(error || hint) && (
        <span
          id={descriptionId}
          className={cx("ss-field__description", error && "ss-field__description--error")}
          role={error ? "status" : undefined}
        >
          {error && <AlertCircle size={15} aria-hidden="true" />}
          {error || hint}
        </span>
      )}
    </label>
  );
}

function AuthExperience({ view, actions }: AppViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<Partial<Record<AuthFieldName, string>>>({});
  const formRef = useRef<HTMLFormElement | null>(null);
  const auth = view.auth;

  useEffect(() => setClientErrors({}), [auth.kind]);

  const errors = { ...clientErrors, ...auth.fieldErrors };
  const errorAnnouncement = [errors.displayName, errors.email, errors.password, errors.confirmPassword]
    .filter(Boolean)
    .join(" ");
  const externalErrorSignature = [
    auth.formError,
    auth.fieldErrors?.displayName,
    auth.fieldErrors?.email,
    auth.fieldErrors?.password,
    auth.fieldErrors?.confirmPassword
  ].filter(Boolean).join("|");
  const changeView = (kind: AuthViewKind) => invoke(() => actions.onAuthViewChange(kind));

  const focusFirstAuthError = () => {
    window.requestAnimationFrame(() => {
      const target = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]');
      target?.focus();
    });
  };

  useEffect(() => {
    if (externalErrorSignature) focusFirstAuthError();
  }, [externalErrorSignature]);

  const submitSignIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Partial<Record<AuthFieldName, string>> = {};
    if (!isEmail(email.trim())) next.email = copy.auth.emailInvalid;
    if (!password) next.password = "Enter your password.";
    setClientErrors(next);
    if (Object.keys(next).length) {
      focusFirstAuthError();
      return;
    }
    invoke(() => actions.onSignIn({ email: email.trim(), password }));
  };

  const submitSignUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Partial<Record<AuthFieldName, string>> = {};
    if (!isEmail(email.trim())) next.email = copy.auth.emailInvalid;
    if (password.length < 8) next.password = copy.auth.passwordShort;
    if (password !== confirmPassword) next.confirmPassword = copy.auth.passwordMismatch;
    setClientErrors(next);
    if (Object.keys(next).length) {
      focusFirstAuthError();
      return;
    }
    invoke(() =>
      actions.onSignUp({
        displayName: displayName.trim() || null,
        email: email.trim(),
        password,
        confirmPassword
      })
    );
  };

  const submitReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEmail(email.trim())) {
      setClientErrors({ email: copy.auth.emailInvalid });
      focusFirstAuthError();
      return;
    }
    setClientErrors({});
    invoke(() => actions.onRequestPasswordReset(email.trim()));
  };

  const resetEmail = auth.resetEmail || email;
  return (
    <main className="ss-auth">
      <aside className="ss-auth__atmosphere" aria-label={copy.brand.name}>
        <Brand />
        <div className="ss-auth__intro">
          <h1>{copy.brand.tagline}</h1>
          <p>{copy.brand.welcome}</p>
        </div>
        <LegalLinks view={view} />
      </aside>
      <section className="ss-auth__main">
        <div className="ss-auth__mobile-brand">
          <Brand compact />
          <p className="ss-auth__mobile-tagline">{copy.brand.tagline}</p>
          <p className="ss-auth__mobile-purpose">{copy.brand.welcome}</p>
        </div>
        <div className="ss-auth-card">
          {view.authControls ? view.authControls : (
          <>
          {errorAnnouncement && (
            <div className="ss-visually-hidden" role="alert" aria-live="assertive" aria-atomic="true">
              {errorAnnouncement}
            </div>
          )}
          {auth.kind === "sign-in" && (
            <form ref={formRef} className="ss-auth-form" noValidate onSubmit={submitSignIn}>
              <h1>{copy.auth.welcomeBack}</h1>
              <Button
                type="button"
                variant="secondary"
                full
                busy={auth.isGooglePending}
                onClick={() => invoke(actions.onContinueWithGoogle)}
              >
                {!auth.isGooglePending && <LogIn size={19} aria-hidden="true" />}
                {auth.isGooglePending ? copy.auth.googlePending : copy.auth.google}
              </Button>
              <div className="ss-auth-divider"><span>or use email</span></div>
              <Field
                label={copy.auth.email}
                type="email"
                value={email}
                error={errors.email}
                autoComplete="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
              />
              <div className="ss-auth-password-row">
                <Field
                  label={copy.auth.password}
                  type="password"
                  value={password}
                  error={errors.password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button className="ss-link-button ss-auth-password-row__link" type="button" onClick={() => changeView("reset-request")}>
                  {copy.auth.forgotPassword}
                </button>
              </div>
              {auth.formError && <InlineError>{auth.formError}</InlineError>}
              <Button type="submit" full busy={auth.isSubmitting}>
                {auth.isSubmitting ? copy.auth.signingIn : copy.auth.signIn}
              </Button>
              <Button type="button" variant="secondary" full onClick={() => invoke(actions.onStartGuest)}>
                {copy.auth.tryDemo}
              </Button>
              <p className="ss-auth-form__help">{copy.auth.demoHelp}</p>
              <p className="ss-auth-switch">
                New here?{" "}
                <button className="ss-link-button" type="button" onClick={() => changeView("sign-up")}>
                  {copy.auth.createAccount}
                </button>
              </p>
            </form>
          )}

          {auth.kind === "sign-up" && (
            <form ref={formRef} className="ss-auth-form" noValidate onSubmit={submitSignUp}>
              <h1>{copy.auth.createAccountTitle}</h1>
              <Field
                label={<>{copy.auth.displayName} <span className="ss-quiet">({copy.auth.optional})</span></>}
                value={displayName}
                error={errors.displayName}
                autoComplete="name"
                maxLength={100}
                onChange={(event) => setDisplayName(event.target.value)}
              />
              <Field
                label={copy.auth.email}
                type="email"
                value={email}
                error={errors.email}
                autoComplete="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
              />
              <Field
                label={copy.auth.password}
                type="password"
                value={password}
                error={errors.password}
                hint={copy.auth.passwordHelp}
                autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)}
              />
              <Field
                label={copy.auth.confirmPassword}
                type="password"
                value={confirmPassword}
                error={errors.confirmPassword}
                autoComplete="new-password"
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              {auth.formError && <InlineError>{auth.formError}</InlineError>}
              <Button type="submit" full busy={auth.isSubmitting}>
                {auth.isSubmitting ? copy.auth.creatingAccount : copy.auth.createAccount}
              </Button>
              <p className="ss-auth-switch">
                Already have an account?{" "}
                <button className="ss-link-button" type="button" onClick={() => changeView("sign-in")}>
                  {copy.auth.signIn}
                </button>
              </p>
            </form>
          )}

          {auth.kind === "reset-request" && (
            <form ref={formRef} className="ss-auth-form" noValidate onSubmit={submitReset}>
              <button className="ss-link-button ss-auth-back" type="button" onClick={() => changeView("sign-in")}>
                ← {copy.auth.backToSignIn}
              </button>
              <h1>{copy.auth.resetTitle}</h1>
              <p className="ss-auth-form__intro">{copy.auth.resetHelp}</p>
              <Field
                label={copy.auth.email}
                type="email"
                value={email}
                error={errors.email}
                autoComplete="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
              />
              {auth.formError && <InlineError>{auth.formError}</InlineError>}
              <Button type="submit" full busy={auth.isSubmitting}>
                {auth.isSubmitting ? copy.auth.sendingReset : copy.auth.sendReset}
              </Button>
            </form>
          )}

          {auth.kind === "reset-confirmation" && (
            <div className="ss-auth-form ss-auth-confirmation">
              <span className="ss-success-mark" aria-hidden="true"><Check size={28} /></span>
              <h1>{copy.auth.resetConfirmationTitle}</h1>
              <p className="ss-auth-form__intro">
                If an account exists for {resetEmail || "that email"}, a reset link is on its way. The link expires in one hour.
              </p>
              <Button type="button" full onClick={() => changeView("sign-in")}>
                {copy.auth.backToSignIn}
              </Button>
              <button
                className="ss-link-button"
                type="button"
                disabled={!resetEmail || auth.isSubmitting}
                onClick={() => resetEmail && invoke(() => actions.onResendPasswordReset(resetEmail))}
              >
                {copy.auth.resend}
              </button>
            </div>
          )}
          </>
          )}
          <div className="ss-auth-card__legal"><LegalLinks view={view} compact /></div>
        </div>
      </section>
    </main>
  );
}

function LegalLinks({ view, compact = false }: { view: AppViewViewProps; compact?: boolean }) {
  return (
    <div className={cx("ss-legal", compact && "ss-legal--compact")}>
      <p>{copy.brand.nonClinical}</p>
      <div>
        <a href={view.privacyHref || "/privacy"}>{copy.common.privacy}</a>
        <a href={view.termsHref || "/terms"}>{copy.common.terms}</a>
      </div>
    </div>
  );
}

function InlineError({ children }: { children: ReactNode }) {
  return (
    <div className="ss-inline-error" role="alert" tabIndex={-1}>
      <AlertCircle size={18} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="ss-loading-screen" aria-busy="true" aria-label="Loading Emotional Friend">
      <Brand />
      <LoaderCircle className="ss-spin" size={28} aria-hidden="true" />
      <p>Preparing your space…</p>
    </main>
  );
}

function GuestExpiredScreen({ view, actions }: AppViewProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <main className="ss-expired">
      <section className="ss-expired__card" aria-labelledby="guest-expired-title">
        <span className="ss-expired__mark" aria-hidden="true"><VideoOff size={30} /></span>
        <h1 ref={titleRef} id="guest-expired-title" tabIndex={-1}>{copy.guest.expiredTitle}</h1>
        <p>{copy.guest.expiredBody}</p>
        <Button full onClick={() => invoke(actions.onCreateAccountFromGuest)}>{copy.auth.createAccount}</Button>
        <Button full variant="secondary" onClick={() => invoke(actions.onRestartGuest)}>{copy.guest.restart}</Button>
        <button className="ss-link-button" type="button" onClick={() => invoke(actions.onReturnToSignIn)}>
          {copy.auth.backToSignIn}
        </button>
      </section>
      <LegalLinks view={view} compact />
    </main>
  );
}

interface SidebarContentProps {
  view: AppViewViewProps;
  actions: AppViewActionProps;
  activeChat: Chat | null;
  deletingChatIds: ReadonlySet<string>;
  onClose?: () => void;
  onRename: (chat: Chat, invoker: HTMLElement | null) => void;
  onDelete: (chat: Chat, invoker: HTMLElement | null) => void;
  onLeaveGuest: (invoker: HTMLElement) => void;
  onSignOut: (invoker: HTMLElement) => void;
}

function SidebarContent({ view, actions, activeChat, deletingChatIds, onClose, onRename, onDelete, onLeaveGuest, onSignOut }: SidebarContentProps) {
  const [menuChatId, setMenuChatId] = useState<string | null>(null);
  const menuOriginRef = useRef<HTMLButtonElement | null>(null);
  const user = view.user;

  const closeMenu = () => {
    setMenuChatId(null);
    window.requestAnimationFrame(() => menuOriginRef.current?.focus());
  };

  return (
    <div className="ss-sidebar__inner">
      <div className="ss-sidebar__brand-row">
        <Brand compact />
        {onClose && (
          <button className="ss-icon-button" type="button" aria-label="Close conversations" onClick={onClose}>
            <X size={21} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="ss-sidebar__new">
        <Button
          full
          onClick={() => {
            invoke(actions.onCreateChat);
            onClose?.();
          }}
        >
          <Plus size={19} aria-hidden="true" /> {copy.chat.newChat}
        </Button>
      </div>
      <nav className="ss-chat-nav" aria-label="Conversations">
        {view.chatListStatus === "loading" && <ChatListSkeleton />}
        {view.chatListStatus === "error" && (
          <div className="ss-sidebar-error" role="alert">
            <span>{view.chatListError || copy.chat.loadError}</span>
            <button type="button" onClick={() => invoke(actions.onRetryChatList)}>{copy.common.retry}</button>
          </div>
        )}
        {view.chatListStatus !== "loading" && view.chatListStatus !== "error" && view.chats.length === 0 && (
          <p className="ss-chat-nav__empty">Your conversations will appear here.</p>
        )}
        {view.chats.map((chat) => {
          const selected = chat.id === activeChat?.id;
          const deleting = deletingChatIds.has(chat.id);
          const menuOpen = menuChatId === chat.id && !deleting;
          return (
            <div className="ss-chat-item-wrap" key={chat.id}>
              <div
                className={cx("ss-chat-item", selected && "ss-chat-item--selected", menuOpen && "ss-chat-item--menu-open", deleting && "ss-chat-item--deleting")}
                aria-busy={deleting || undefined}
              >
                <button
                  className="ss-chat-item__select"
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  aria-disabled={deleting || undefined}
                  disabled={deleting}
                  title={chat.title}
                  onClick={() => {
                    if (deleting) return;
                    invoke(() => actions.onSelectChat(chat.id));
                    setMenuChatId(null);
                    onClose?.();
                  }}
                >
                  <span className="ss-chat-item__title">{chat.title}</span>
                  <span className={cx("ss-chat-item__meta", deleting && "ss-chat-item__meta--busy")}>
                    {deleting && <LoaderCircle className="ss-spin" size={13} aria-hidden="true" />}
                    {deleting ? copy.chat.deleting : chatMeta(chat)}
                  </span>
                </button>
                <button
                  ref={menuOpen ? menuOriginRef : undefined}
                  className="ss-chat-item__menu-button"
                  type="button"
                  aria-label={`Actions for ${chat.title}`}
                  aria-expanded={menuOpen}
                  aria-disabled={deleting || undefined}
                  onClick={(event) => {
                    if (deleting) return;
                    menuOriginRef.current = event.currentTarget;
                    setMenuChatId(menuOpen ? null : chat.id);
                  }}
                >
                  <Ellipsis size={19} aria-hidden="true" />
                </button>
              </div>
              {menuOpen && (
                <ActionMenu label={`Actions for ${chat.title}`} onClose={closeMenu}>
                  <button type="button" role="menuitem" onClick={() => { const invoker = menuOriginRef.current; closeMenu(); onRename(chat, invoker); }}>
                    <Pencil size={17} aria-hidden="true" /> {copy.chat.rename}
                  </button>
                  <button className="ss-menu-danger" type="button" role="menuitem" onClick={() => { const invoker = menuOriginRef.current; closeMenu(); onDelete(chat, invoker); }}>
                    <Trash2 size={17} aria-hidden="true" /> {copy.chat.delete}
                  </button>
                </ActionMenu>
              )}
            </div>
          );
        })}
        {view.hasMoreChats && view.chatListStatus !== "loading" && (
          <button
            className="ss-load-more"
            type="button"
            disabled={view.isLoadingMoreChats}
            onClick={() => actions.onLoadMoreChats && invoke(actions.onLoadMoreChats)}
          >
            {view.isLoadingMoreChats && <LoaderCircle className="ss-spin" size={16} aria-hidden="true" />}
            {copy.chat.loadOlder}
          </button>
        )}
      </nav>
      {view.session === "guest" ? (
        <div className="ss-sidebar__guest-card">
          <p>{copy.guest.migrationNote}</p>
          <div className="ss-sidebar__guest-actions">
            <Button full onClick={() => invoke(actions.onCreateAccountFromGuest)}>{copy.auth.createAccount}</Button>
            <Button full variant="danger" onClick={(event) => onLeaveGuest(event.currentTarget)}>
              <Trash2 size={18} aria-hidden="true" /> {copy.guest.leaveDemo}
            </Button>
          </div>
        </div>
      ) : (
        <div className="ss-account-summary">
          <span className="ss-avatar" aria-hidden="true">{initialsFor(user)}</span>
          <div className="ss-account-summary__copy">
            <strong>{user?.displayName || user?.email || "Account"}</strong>
            <span>{copy.common.accountPrivacy}</span>
          </div>
          {view.accountControls ?? (
            <button className="ss-icon-button" type="button" aria-label={copy.common.signOut} onClick={(event) => onSignOut(event.currentTarget)}>
              <LogOut size={19} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ChatListSkeleton() {
  return (
    <div className="ss-chat-skeleton" aria-label="Loading conversations">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="ss-chat-skeleton__item">
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

function ActionMenu({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.querySelector<HTMLElement>("button")?.focus();
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  return (
    <div className="ss-action-layer">
      <button className="ss-action-layer__backdrop" type="button" aria-label={copy.common.close} onClick={onClose} />
      <div ref={ref} className="ss-action-menu" role="menu" aria-label={label}>{children}</div>
    </div>
  );
}

function AppHeader({
  view,
  activeChat,
  sidebarCollapsed,
  mobileNavigation,
  navigationExpanded,
  cameraOpen,
  navigationButtonRef,
  onToggleNavigation,
  onOpenCamera
}: {
  view: AppViewViewProps;
  activeChat: Chat | null;
  sidebarCollapsed: boolean;
  mobileNavigation: boolean;
  navigationExpanded: boolean;
  cameraOpen: boolean;
  navigationButtonRef: RefObject<HTMLButtonElement | null>;
  onToggleNavigation: () => void;
  onOpenCamera: () => void;
}) {
  const camera = view.camera;
  const cameraOn = camera.phase === "on" || camera.phase === "no-face";
  const cameraUnavailable = camera.phase === "denied" || camera.phase === "unavailable";
  const cameraText = cameraOn
    ? copy.camera.on
    : cameraUnavailable
      ? copy.camera.unavailable
      : copy.camera.off;
  return (
    <header className="ss-app-header">
      <button
        ref={navigationButtonRef}
        className="ss-icon-button ss-app-header__menu"
        type="button"
        aria-label={mobileNavigation
          ? navigationExpanded ? "Hide conversations" : "Show conversations"
          : sidebarCollapsed ? "Open conversations" : "Hide conversations"}
        aria-expanded={navigationExpanded}
        onClick={onToggleNavigation}
      >
        <span className="ss-desktop-only" aria-hidden="true">
          {sidebarCollapsed ? <PanelLeftOpen size={21} /> : <PanelLeftClose size={21} />}
        </span>
        <Menu className="ss-mobile-only" size={22} aria-hidden="true" />
      </button>
      <div className="ss-app-header__title">
        <strong title={activeChat?.title}>{activeChat?.title || copy.chat.noChatSelected}</strong>
        <span>{view.session === "guest" ? copy.chat.localOnly : copy.chat.saved}</span>
      </div>
      {view.connectionStatus && view.connectionStatus !== "online" && (
        <span className="ss-connection-status" role="status">
          {view.connectionStatus === "offline" ? "Offline" : "Reconnecting…"}
        </span>
      )}
      <button
        className={cx("ss-status-chip", cameraOn && "ss-status-chip--success", cameraUnavailable && "ss-status-chip--warning")}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={cameraOpen}
        onClick={onOpenCamera}
      >
        <Camera size={16} aria-hidden="true" />
        <span>{cameraText}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {view.session === "guest" ? (
        <span className="ss-avatar ss-avatar--guest" aria-label="Guest mode"><UserRound size={18} /></span>
      ) : (
        <span className="ss-avatar" aria-label={view.user?.displayName || "Account"}>{initialsFor(view.user)}</span>
      )}
    </header>
  );
}

function GuestBanner({ view, actions }: AppViewProps) {
  if (view.session !== "guest") return null;
  return (
    <div className="ss-guest-stack">
      <aside className="ss-guest-banner">
        <span className="ss-guest-banner__dot" aria-hidden="true" />
        <p>{copy.guest.banner}</p>
        <button type="button" onClick={() => invoke(actions.onCreateAccountFromGuest)}>{copy.auth.createAccount}</button>
      </aside>
      {view.guest?.storageWarning && (
        <aside className="ss-storage-warning" role="status">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{view.guest.storageWarning}</span>
        </aside>
      )}
    </div>
  );
}

interface ConversationProps {
  view: AppViewViewProps;
  actions: AppViewActionProps;
  activeChat: Chat | null;
  deletingActiveChat: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onOpenCamera: () => void;
  cameraOpen: boolean;
  onDialog: (dialog: DialogState, invoker?: HTMLElement | null) => void;
  extraAnnouncement: string;
  onAnnouncement: (message: string) => void;
}

function Conversation({ view, actions, activeChat, deletingActiveChat, draft, onDraftChange, onOpenCamera, cameraOpen, onDialog, extraAnnouncement, onAnnouncement }: ConversationProps) {
  const messages = activeChat?.messages || [];
  const generationPending = messages.some((message) => message.status === "pending");
  return (
    <main
      id="active-conversation"
      className="ss-conversation"
      aria-label="Active conversation"
      aria-busy={deletingActiveChat || undefined}
      tabIndex={-1}
    >
      <GuestBanner view={view} actions={actions} />
      {activeChat && deletingActiveChat && (
        <div className="ss-deleting-chat-banner">
          <LoaderCircle className="ss-spin" size={18} aria-hidden="true" />
          <strong>{copy.chat.deletingCurrent}</strong>
          <span>{activeChat.title}</span>
        </div>
      )}
      <LiveRegions
        activeChatId={activeChat?.id || null}
        messages={messages}
        extraPolite={extraAnnouncement}
      />
      {!activeChat ? (
        <NoChatsState onCreate={() => invoke(actions.onCreateChat)} />
      ) : view.messageListStatus === "loading" ? (
        <MessageSkeleton />
      ) : view.messageListStatus === "error" ? (
        <div className="ss-conversation-state" role="alert">
          <AlertCircle size={30} aria-hidden="true" />
          <h2>{view.messageListError || copy.chat.messagesLoadError}</h2>
          <Button variant="secondary" onClick={() => invoke(() => actions.onRetryMessages(activeChat.id))}>
            <RefreshCw size={18} aria-hidden="true" /> {copy.common.retry}
          </Button>
        </div>
      ) : messages.length === 0 ? (
        <EmptyChatState />
      ) : (
        <MessageLog
          view={view}
          actions={actions}
          chat={activeChat}
          onDialog={onDialog}
          onAnnouncement={onAnnouncement}
        />
      )}
      <Composer
        activeChat={activeChat}
        camera={view.camera}
        draft={draft}
        disabled={!activeChat || generationPending || deletingActiveChat}
        onDraftChange={onDraftChange}
        onOpenCamera={onOpenCamera}
        cameraOpen={cameraOpen}
        onSend={(text) => activeChat && invoke(() => actions.onSendMessage({ chatId: activeChat.id, text }))}
      />
    </main>
  );
}

function NoChatsState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="ss-conversation-state" aria-labelledby="no-chats-title">
      <span className="ss-empty-mark" aria-hidden="true"><MessageCircle size={40} /></span>
      <h1 id="no-chats-title">{copy.chat.noChatsTitle}</h1>
      <p>{copy.chat.noChatsBody}</p>
      <Button onClick={onCreate}><Plus size={19} aria-hidden="true" /> {copy.chat.startChat}</Button>
    </section>
  );
}

function EmptyChatState() {
  return (
    <section className="ss-conversation-state ss-conversation-state--empty" aria-labelledby="empty-chat-title">
      <h1 id="empty-chat-title">{copy.chat.emptyTitle}</h1>
      <p>{copy.chat.emptyBody}</p>
    </section>
  );
}

function MessageSkeleton() {
  return (
    <div className="ss-message-skeleton" aria-label="Loading conversation">
      <span className="ss-message-skeleton__user" />
      <span className="ss-message-skeleton__assistant" />
      <span className="ss-message-skeleton__user ss-message-skeleton__user--short" />
    </div>
  );
}

function LiveRegions({ activeChatId, messages, extraPolite }: {
  activeChatId: string | null;
  messages: Message[];
  extraPolite: string;
}) {
  const [polite, setPolite] = useState("");
  const previousChatRef = useRef<string | null>(null);
  const lastAssistantRef = useRef<string | null>(null);

  useEffect(() => {
    const latestAssistant = [...messages].reverse().find(
      (message) => message.role === "assistant" && message.status === "complete"
    );
    if (previousChatRef.current !== activeChatId) {
      previousChatRef.current = activeChatId;
      lastAssistantRef.current = latestAssistant?.id || null;
      setPolite("");
      return;
    }
    if (latestAssistant && latestAssistant.id !== lastAssistantRef.current) {
      lastAssistantRef.current = latestAssistant.id;
      setPolite(`${copy.message.friendSaid}: ${latestAssistant.text}`);
    }
  }, [activeChatId, messages]);

  useEffect(() => {
    if (extraPolite) setPolite(extraPolite);
  }, [extraPolite]);

  return <div className="ss-visually-hidden" role="status" aria-live="polite" aria-atomic="true">{polite}</div>;
}

function MessageLog({ view, actions, chat, onDialog, onAnnouncement }: {
  view: AppViewViewProps;
  actions: AppViewActionProps;
  chat: Chat;
  onDialog: (dialog: DialogState, invoker?: HTMLElement | null) => void;
  onAnnouncement: (message: string) => void;
}) {
  const scrollRef = useRef<HTMLOListElement>(null);
  const atBottomRef = useRef(true);
  const previousRef = useRef<{ chatId: string; length: number; lastId: string | null }>({ chatId: "", length: 0, lastId: null });
  const [unread, setUnread] = useState(0);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const menuOriginRef = useRef<HTMLButtonElement | null>(null);
  const presentedMessages = useMemo<Array<{ message: Message; affectedUser?: Message }>>(() => {
    const maximumPairingDistance = 1;
    const affectedUsers = new Map<string, Array<{ message: Message; index: number }>>();
    const pairedAssistantStates = new Map<number, Message[]>();
    const pairedAssistantIndexes = new Set<number>();

    chat.messages.forEach((message, index) => {
      const requestId = message.clientRequestId?.trim();
      if (message.role === "user" && requestId) {
        const users = affectedUsers.get(requestId) || [];
        users.push({ message, index });
        affectedUsers.set(requestId, users);
      }
    });

    chat.messages.forEach((message, index) => {
      const requestId = message.clientRequestId?.trim();
      if (
        message.role === "assistant" &&
        (message.status === "pending" || message.status === "failed" || message.status === "complete") &&
        requestId
      ) {
        const users = affectedUsers.get(requestId) || [];
        const affectedUser = users.reduce<(typeof users)[number] | undefined>(
          (closest, candidate) =>
            !closest || Math.abs(candidate.index - index) < Math.abs(closest.index - index)
              ? candidate
              : closest,
          undefined
        );
        if (affectedUser && Math.abs(affectedUser.index - index) <= maximumPairingDistance) {
          const states = pairedAssistantStates.get(affectedUser.index) || [];
          states.push(message);
          pairedAssistantStates.set(affectedUser.index, states);
          pairedAssistantIndexes.add(index);
        }
      }
    });

    return chat.messages.flatMap((message, index) => {
      const requestId = message.clientRequestId?.trim();
      if (pairedAssistantIndexes.has(index)) {
        return [];
      }
      if (message.role === "user") {
        const pairedStates = pairedAssistantStates.get(index) || [];
        return [
          { message },
          ...pairedStates.map((assistantState) => ({
            message: assistantState,
            affectedUser: message
          }))
        ];
      }
      const legacyAffectedUser =
        message.role === "assistant" &&
        message.status === "failed" &&
        !requestId
          ? chat.messages[index - 1]?.role === "user"
            ? chat.messages[index - 1]
            : undefined
          : undefined;
      return [{ message, affectedUser: legacyAffectedUser }];
    });
  }, [chat.messages]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior });
    atBottomRef.current = true;
    setUnread(0);
  };

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const last = chat.messages[chat.messages.length - 1];
    const previous = previousRef.current;
    if (previous.chatId !== chat.id) {
      previousRef.current = { chatId: chat.id, length: chat.messages.length, lastId: last?.id || null };
      element.scrollTop = element.scrollHeight;
      atBottomRef.current = true;
      setUnread(0);
      return;
    }
    const appended = chat.messages.length > previous.length || (last && last.id !== previous.lastId);
    previousRef.current = { chatId: chat.id, length: chat.messages.length, lastId: last?.id || null };
    if (!appended || !last) return;
    if (last.role === "user" || atBottomRef.current) {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    } else if (last.role === "assistant") {
      setUnread((value) => value + 1);
    }
  }, [chat.id, chat.messages]);

  const closeMenu = () => {
    setMenuMessageId(null);
    window.requestAnimationFrame(() => menuOriginRef.current?.focus());
  };

  const copyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.text);
      onAnnouncement(copy.message.copied);
    } catch {
      onAnnouncement("Copy is unavailable in this browser.");
    }
    closeMenu();
  };

  return (
    <div className="ss-message-region">
      <div
        className="ss-message-log-wrapper"
        role="log"
        aria-label="Conversation messages"
        aria-live="off"
      >
      <ol
        ref={scrollRef}
        className="ss-message-log"
        onScroll={(event) => {
          const element = event.currentTarget;
          atBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 72;
          if (atBottomRef.current) setUnread(0);
        }}
      >
        {view.hasOlderMessages && (
          <li className="ss-message-log__load-older">
            <button
              type="button"
              disabled={view.isLoadingOlderMessages}
              onClick={() => actions.onLoadOlderMessages && invoke(() => actions.onLoadOlderMessages!(chat.id))}
            >
              {view.isLoadingOlderMessages && <LoaderCircle className="ss-spin" size={16} aria-hidden="true" />}
              {copy.chat.loadOlderMessages}
            </button>
          </li>
        )}
        {presentedMessages.map(({ message, affectedUser }) => {
          const menuOpen = menuMessageId === message.id;
          return (
            <MessageItem
              key={message.id}
              message={message}
              menuOpen={menuOpen}
              affectedUser={affectedUser}
              view={view}
              actions={actions}
              onMenu={(origin) => {
                menuOriginRef.current = origin;
                setMenuMessageId(menuOpen ? null : message.id);
              }}
              onCloseMenu={closeMenu}
              onCopy={() => void copyMessage(message)}
              onEdit={(target, invoker) => { const origin = invoker || menuOriginRef.current; closeMenu(); onDialog({ kind: "edit-message", message: target }, origin); }}
              onDelete={(invoker) => { const origin = invoker || menuOriginRef.current; closeMenu(); onDialog({ kind: "delete-message", message }, origin); }}
            />
          );
        })}
      </ol>
      </div>
      {unread > 0 && (
        <button className="ss-return-latest" type="button" onClick={() => scrollToBottom()}>
          <ArrowDown size={17} aria-hidden="true" />
          {unread} new {unread === 1 ? "reply" : "replies"} · {copy.message.returnToLatest}
        </button>
      )}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  affectedUser?: Message;
  menuOpen: boolean;
  view: AppViewViewProps;
  actions: AppViewActionProps;
  onMenu: (origin: HTMLButtonElement) => void;
  onCloseMenu: () => void;
  onCopy: () => void;
  onEdit: (message: Message, invoker: HTMLElement | null) => void;
  onDelete: (invoker: HTMLElement | null) => void;
}

function MessageItem({ message, affectedUser, menuOpen, view, actions, onMenu, onCloseMenu, onCopy, onEdit, onDelete }: MessageItemProps) {
  const isUser = message.role === "user";
  if (message.status === "deleted") {
    return (
      <li className={cx("ss-message-row", isUser ? "ss-message-row--user" : "ss-message-row--assistant")}>
        <div className="ss-deleted-message">
          <span>{copy.message.deleted}</span>
          {actions.onUndoDeleteMessage && (
            <button type="button" onClick={() => invoke(() => actions.onUndoDeleteMessage!(message))}>{copy.message.undo}</button>
          )}
        </div>
      </li>
    );
  }
  if (message.status === "failed") {
    const editable = affectedUser?.status === "deleted"
      ? undefined
      : affectedUser || (isUser ? message : undefined);
    return (
      <li className="ss-message-row ss-message-row--assistant">
        <AssistantMark muted />
        <div className="ss-generation-failure" role="alert" aria-atomic="true">
          <strong>{copy.message.failed}</strong>
          <p>{copy.message.failedHelp}</p>
          <div>
            <Button variant="danger" onClick={() => invoke(() => actions.onRetryMessage(message))}>{copy.message.retry}</Button>
            {editable && <Button variant="secondary" onClick={(event) => onEdit(editable, event.currentTarget)}>{copy.message.edit}</Button>}
          </div>
        </div>
      </li>
    );
  }
  if (!isUser && message.status === "pending") {
    return (
      <li className="ss-message-row ss-message-row--assistant">
        <AssistantMark />
        <ReplyIndicator />
      </li>
    );
  }

  const isSafety = Boolean(message.safetySupport);
  return (
    <li className={cx("ss-message-row", isUser ? "ss-message-row--user" : "ss-message-row--assistant", isSafety && "ss-message-row--safety")}>
      {!isUser && <AssistantMark />}
      <article className={cx("ss-message", isUser ? "ss-message--user" : "ss-message--assistant")}>
        <span className="ss-visually-hidden">{isUser ? copy.message.youSaid : copy.message.friendSaid}</span>
        <div className="ss-message__text">{message.text}</div>
        {message.status === "pending" && <span className="ss-message__status">{copy.message.sending}</span>}
        <button
          className="ss-message__menu-button"
          type="button"
          aria-label={`Actions for ${isUser ? "your" : "the assistant's"} message`}
          aria-expanded={menuOpen}
          onClick={(event) => onMenu(event.currentTarget)}
        >
          <Ellipsis size={19} aria-hidden="true" />
        </button>
        {menuOpen && (
          <ActionMenu label="Message actions" onClose={onCloseMenu}>
            <button type="button" role="menuitem" onClick={onCopy}><Copy size={17} aria-hidden="true" /> {copy.message.copy}</button>
            {isUser && <button type="button" role="menuitem" onClick={() => onEdit(message, null)}><Pencil size={17} aria-hidden="true" /> {copy.message.edit}</button>}
            <button className="ss-menu-danger" type="button" role="menuitem" onClick={() => onDelete(null)}><Trash2 size={17} aria-hidden="true" /> {copy.message.delete}</button>
          </ActionMenu>
        )}
      </article>
      {isSafety && <SafetyActionCard view={view} actions={actions} />}
    </li>
  );
}

function AssistantMark({ muted = false }: { muted?: boolean }) {
  return <span className={cx("ss-assistant-mark", muted && "ss-assistant-mark--muted")} aria-hidden="true"><Sparkles size={14} /></span>;
}

function ReplyIndicator() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <div
      className="ss-reply-indicator"
      role="status"
      aria-atomic="true"
      data-motion={reducedMotion ? "static" : "animated"}
    >
      <span className="ss-reply-indicator__progress" aria-hidden="true">
        <span
          className={cx(
            "ss-reply-indicator__progress-fill",
            !reducedMotion && "ss-reply-indicator__progress-fill--animated"
          )}
        />
      </span>
      <span>{copy.message.writing}</span>
    </div>
  );
}

function SafetyActionCard({ view, actions }: AppViewProps) {
  const [regionOpen, setRegionOpen] = useState(false);
  const [region, setRegion] = useState(view.selectedSafetyRegion || "");
  const regions = view.safetyRegions || [];
  return (
    <aside className="ss-safety-card" aria-labelledby="safety-card-title">
      <div className="ss-safety-card__title">
        <ShieldCheck size={20} aria-hidden="true" />
        <strong id="safety-card-title">{copy.safety.title}</strong>
      </div>
      <div className="ss-safety-card__actions">
        <Button onClick={() => invoke(actions.onEmergencyHelp)}>{copy.safety.emergency}</Button>
        {regions.length > 0 && (
          <Button variant="secondary" aria-expanded={regionOpen} onClick={() => setRegionOpen((value) => !value)}>{copy.safety.region}</Button>
        )}
      </div>
      {regions.length === 0 && (
        <div className="ss-region-unavailable" role="status">
          <AlertCircle size={18} aria-hidden="true" />
          <p>{copy.safety.regionUnavailable}</p>
        </div>
      )}
      {regionOpen && regions.length > 0 && (
        <div className="ss-region-selector">
          <label htmlFor="safety-region">{copy.safety.regionLabel}</label>
          <select id="safety-region" value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="">Select a country or region</option>
            {regions.map((option) => <option value={option.code} key={option.code}>{option.label}</option>)}
          </select>
          <Button variant="secondary" disabled={!region.trim()} onClick={() => invoke(() => actions.onSelectSafetyRegion(region.trim()))}>
            {copy.safety.showResources}
          </Button>
          <p>{copy.safety.reviewedOnly}</p>
        </div>
      )}
      <p>{copy.safety.monitoring}</p>
    </aside>
  );
}

function Composer({ activeChat, camera, draft, disabled, onDraftChange, onOpenCamera, cameraOpen, onSend }: {
  activeChat: Chat | null;
  camera: CameraViewState;
  draft: string;
  disabled: boolean;
  onDraftChange: (value: string) => void;
  onOpenCamera: () => void;
  cameraOpen: boolean;
  onSend: (text: string) => void;
}) {
  const mobile = useMediaQuery("(max-width: 767px)");
  const trimmed = draft.trim();
  const tooLong = codePointLength(draft) > 8000;
  const canSend = Boolean(activeChat && trimmed && !disabled && !tooLong);

  const send = () => {
    if (!canSend) return;
    onSend(trimmed);
    onDraftChange("");
  };

  const cameraOn = camera.phase === "on" || camera.phase === "no-face";
  const cameraUnavailable = camera.phase === "denied" || camera.phase === "unavailable";
  const cameraLabel = cameraOn
    ? camera.phase === "no-face" || !camera.label || camera.label === "unavailable"
      ? copy.camera.noEstimate
      : copy.camera.estimated(displayExpression(camera.label))
    : cameraUnavailable ? copy.camera.unavailable : copy.camera.off;

  return (
    <footer className="ss-composer-area">
      <form className="ss-composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
        <label className="ss-visually-hidden" htmlFor="message-composer">{copy.composer.placeholder}</label>
        <textarea
          id="message-composer"
          rows={1}
          value={draft}
          placeholder={copy.composer.placeholder}
          disabled={!activeChat}
          aria-invalid={tooLong}
          aria-describedby="composer-help"
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
            if (!mobile && event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send();
            }
          }}
        />
        <div className="ss-composer__controls">
          <button
            className={cx("ss-status-chip", cameraOn && "ss-status-chip--success", cameraUnavailable && "ss-status-chip--warning")}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={cameraOpen}
            onClick={onOpenCamera}
          >
            <Camera size={16} aria-hidden="true" /> <span>{cameraLabel}</span>
          </button>
          <div className="ss-composer__send-group">
            <span id="composer-help" className={cx("ss-composer__hint", tooLong && "ss-composer__hint--error")}>
              {tooLong ? copy.composer.tooLong : mobile ? copy.composer.mobileHint : copy.composer.desktopHint}
            </span>
            <button className="ss-send-button" type="submit" disabled={!canSend} aria-label={copy.composer.send}>
              <Send size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>
      <p className="ss-composer-area__note">{copy.brand.nonClinical}</p>
    </footer>
  );
}

function CameraSurface({ open, view, actions, onClose, returnFocusRef }: {
  open: boolean;
  view: AppViewViewProps;
  actions: AppViewActionProps;
  onClose: () => void;
  returnFocusRef: { current: HTMLElement | null };
}) {
  const titleId = useId();
  const mobileSheet = useMediaQuery("(max-width: 1023px)");
  const camera = view.camera;
  const close = () => {
    if (camera.phase === "model-loading" || camera.phase === "permission-pending") invoke(actions.onCancelCamera);
    onClose();
  };
  const cameraCloseRef = useRef(close);
  cameraCloseRef.current = close;

  useEffect(() => {
    if (!open || mobileSheet) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      cameraCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, mobileSheet]);

  const stop = () => {
    invoke(actions.onStopCamera);
    onClose();
  };
  return (
    <Overlay
      open={open}
      titleId={titleId}
      className="ss-camera-overlay"
      modal={mobileSheet}
      trapFocus={mobileSheet}
      onClose={close}
      returnFocusRef={returnFocusRef}
    >
      <div className="ss-sheet-handle" aria-hidden="true" />
      <div className="ss-camera-panel__header">
        <h2 id={titleId}>{camera.phase === "off" || camera.phase === "consent" ? copy.camera.firstUseTitle : copy.camera.title}</h2>
        <button className="ss-icon-button" type="button" aria-label={copy.common.close} onClick={close}><X size={20} /></button>
      </div>
      {(camera.phase === "off" || camera.phase === "consent") && (
        <div className="ss-camera-state">
          <p>{copy.camera.firstUse}</p>
          <ul className="ss-camera-facts">
            <li>{copy.camera.microphone}</li>
            <li>{copy.camera.metadata}</li>
            <li>{copy.camera.optional}</li>
          </ul>
          <Button full data-autofocus onClick={() => invoke(actions.onRequestCamera)}>{copy.camera.turnOn}</Button>
          <Button full variant="secondary" onClick={close}>{copy.camera.notNow}</Button>
        </div>
      )}
      {camera.phase === "model-loading" && (
        <div className="ss-camera-state" aria-busy="true">
          <div className="ss-camera-preview ss-camera-preview--placeholder">{copy.camera.previewPending}</div>
          <progress max={100} value={camera.loadingProgress ?? undefined} aria-label="Expression model loading progress" />
          <strong>{copy.camera.loading}</strong>
          <p>{copy.camera.loadingHelp}</p>
          <Button full variant="secondary" data-autofocus onClick={close}>{copy.camera.cancel}</Button>
        </div>
      )}
      {camera.phase === "permission-pending" && (
        <div className="ss-camera-state ss-camera-state--center" aria-busy="true">
          <LoaderCircle className="ss-spin" size={30} aria-hidden="true" />
          <strong>{copy.camera.permissionPending}</strong>
          <p>{copy.camera.permissionHelp}</p>
          <Button full variant="secondary" data-autofocus onClick={close}>{copy.camera.cancel}</Button>
        </div>
      )}
      {camera.phase === "on" && (
        <div className="ss-camera-state">
          <span className="ss-camera-state-chip ss-camera-state-chip--on">● On</span>
          <video ref={camera.previewRef} className="ss-camera-preview" autoPlay muted playsInline aria-label="Local camera preview" />
          <div>
            <strong className="ss-camera-estimate">{copy.camera.estimated(displayExpression(camera.label))}</strong>
            <p>{copy.camera.confidence(displayConfidence(camera.confidenceBand))}</p>
          </div>
          <div className="ss-toggle-row">
            <button
              className={cx("ss-toggle", camera.useEstimate && "ss-toggle--on")}
              type="button"
              role="switch"
              aria-checked={camera.useEstimate}
              aria-labelledby="camera-tone-toggle-label"
              aria-describedby="camera-tone-toggle-help"
              onClick={() => invoke(() => actions.onSetUseEstimate(!camera.useEstimate))}
            ><span /></button>
            <span><strong id="camera-tone-toggle-label">{copy.camera.toneToggle}</strong><small id="camera-tone-toggle-help">{camera.useEstimate ? copy.camera.toneOnHelp : copy.camera.toneOffHelp}</small></span>
          </div>
          <p className="ss-camera-privacy">{copy.camera.processedLocally}</p>
          <Button full variant="secondary" data-autofocus onClick={stop}>{copy.camera.stop}</Button>
        </div>
      )}
      {camera.phase === "no-face" && (
        <div className="ss-camera-state">
          <span className="ss-camera-state-chip">{copy.camera.noEstimate}</span>
          <video ref={camera.previewRef} className="ss-camera-preview" autoPlay muted playsInline aria-label="Local camera preview" />
          <strong>{copy.camera.noFaceTitle}</strong>
          <p>{copy.camera.noFaceBody}</p>
          <Button full variant="secondary" data-autofocus onClick={stop}>{copy.camera.stop}</Button>
        </div>
      )}
      {(camera.phase === "denied" || camera.phase === "unavailable") && (
        <div className="ss-camera-state">
          <span className="ss-camera-state-chip ss-camera-state-chip--warning">Unavailable</span>
          <strong>{camera.phase === "denied" ? copy.camera.deniedTitle : copy.camera.unavailable}</strong>
          <p>{camera.errorMessage || (camera.phase === "denied"
            ? copy.camera.deniedBody
            : copy.camera.errors[camera.errorReason ?? "unknown"])}</p>
          <Button full variant="secondary" data-autofocus onClick={() => invoke(actions.onRetryCamera)}>{copy.camera.retry}</Button>
          <Button full onClick={onClose}>{copy.camera.continueWithout}</Button>
        </div>
      )}
    </Overlay>
  );
}

function RenameChatDialog({ dialog, actions, onClose, returnFocusRef }: { dialog: Extract<DialogState, { kind: "rename-chat" }>; actions: AppViewActionProps; onClose: () => void; returnFocusRef: { current: HTMLElement | null } }) {
  const [title, setTitle] = useState(dialog.chat.title);
  const titleId = useId();
  const count = codePointLength(title);
  const valid = Boolean(title.trim()) && count <= 100;
  return (
    <Overlay open titleId={titleId} className="ss-dialog-overlay" onClose={onClose} returnFocusRef={returnFocusRef}>
      <h2 id={titleId}>{copy.chat.rename}</h2>
      <label className="ss-field">
        <span className="ss-field__label">{copy.chat.renameLabel}</span>
        <input
          className="ss-field__control"
          data-autofocus
          value={title}
          maxLength={200}
          onChange={(event) => setTitle(limitCodePoints(event.target.value, 100))}
        />
        <span className="ss-field__counter"><span>{copy.chat.renameEmpty}</span><span>{count}/100</span></span>
      </label>
      <div className="ss-dialog-actions">
        <Button variant="secondary" onClick={onClose}>{copy.common.cancel}</Button>
        <Button disabled={!valid} onClick={() => { invoke(() => actions.onRenameChat(dialog.chat.id, title.trim())); onClose(); }}>{copy.chat.saveName}</Button>
      </div>
    </Overlay>
  );
}

function ConfirmDialog({ title, body, confirmLabel, cancelLabel, onConfirm, onClose, returnFocusRef }: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  returnFocusRef: { current: HTMLElement | null };
}) {
  const titleId = useId();
  return (
    <Overlay open titleId={titleId} className="ss-dialog-overlay" onClose={onClose} returnFocusRef={returnFocusRef}>
      <h2 id={titleId}>{title}</h2>
      <p>{body}</p>
      <div className="ss-dialog-actions">
        <Button variant="secondary" data-autofocus onClick={onClose}>{cancelLabel || (title === copy.common.signOutTitle ? copy.common.stay : title === copy.message.deleteTitle ? copy.message.keep : copy.chat.keep)}</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Overlay>
  );
}

function EditMessageDialog({ dialog, actions, onClose, returnFocusRef }: { dialog: Extract<DialogState, { kind: "edit-message" }>; actions: AppViewActionProps; onClose: () => void; returnFocusRef: { current: HTMLElement | null } }) {
  const [text, setText] = useState(dialog.message.text);
  const titleId = useId();
  const count = codePointLength(text);
  const valid = Boolean(text.trim()) && count <= 8000;
  return (
    <Overlay open titleId={titleId} className="ss-dialog-overlay" onClose={onClose} returnFocusRef={returnFocusRef}>
      <h2 id={titleId}>{copy.message.editTitle}</h2>
      <label className="ss-field">
        <span className="ss-field__label">Message</span>
        <textarea
          className="ss-edit-textarea"
          data-autofocus
          value={text}
          rows={6}
          onChange={(event) => setText(event.target.value)}
          aria-invalid={count > 8000}
        />
        <span className={cx("ss-field__counter", count > 8000 && "ss-field__counter--error")}><span>{count > 8000 ? copy.composer.tooLong : "Your original message will remain until the resend is accepted."}</span><span>{count}/8000</span></span>
      </label>
      <div className="ss-dialog-actions">
        <Button variant="secondary" onClick={onClose}>{copy.common.cancel}</Button>
        <Button disabled={!valid} onClick={() => { invoke(() => actions.onEditAndResendMessage(dialog.message, text.trim())); onClose(); }}>{copy.message.edit}</Button>
      </div>
    </Overlay>
  );
}

function AppShell({ view, actions }: AppViewProps) {
  const mobileOrTablet = useMediaQuery("(max-width: 1023px)");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState("");
  const [localDeletingChatIds, setLocalDeletingChatIds] = useState<readonly string[]>([]);
  const navigationButtonRef = useRef<HTMLButtonElement | null>(null);
  const cameraButtonRef = useRef<HTMLElement | null>(null);
  const dialogReturnFocusRef = useRef<HTMLElement | null>(null);
  const previousDeletingChatIdsRef = useRef<ReadonlySet<string>>(new Set());
  const deletingChatTitlesRef = useRef<Map<string, string>>(new Map());
  const activeChat = view.chats.find((chat) => chat.id === view.activeChatId) || null;
  const deletingChatIds = useMemo(
    () => new Set([...view.deletingChatIds, ...localDeletingChatIds]),
    [view.deletingChatIds, localDeletingChatIds]
  );
  const deletingActiveChat = Boolean(activeChat && deletingChatIds.has(activeChat.id));
  const activeDraft = activeChat ? drafts[activeChat.id] || "" : "";
  const pending = Boolean(activeChat?.messages.some((message) => message.status === "pending"));

  useEffect(() => {
    if (!mobileOrTablet) setDrawerOpen(false);
  }, [mobileOrTablet]);

  useEffect(() => {
    const previous = previousDeletingChatIdsRef.current;
    const started = [...deletingChatIds].filter((chatId) => !previous.has(chatId));
    const finished = [...previous].filter((chatId) => !deletingChatIds.has(chatId));
    for (const chatId of started) {
      const title = view.chats.find((chat) => chat.id === chatId)?.title || "chat";
      deletingChatTitlesRef.current.set(chatId, title);
    }
    if (started.length) {
      const title = deletingChatTitlesRef.current.get(started[0]) || "chat";
      setAnnouncement(copy.chat.deletingAnnounce(title));
    } else {
      const terminal = finished.find((chatId) => !view.chats.some((chat) => chat.id === chatId));
      if (terminal) {
        const title = deletingChatTitlesRef.current.get(terminal) || "chat";
        setAnnouncement(copy.chat.deletedAnnounce(title));
        deletingChatTitlesRef.current.delete(terminal);
      }
    }
    previousDeletingChatIdsRef.current = new Set(deletingChatIds);
  }, [deletingChatIds, view.chats]);

  const openDialog = (nextDialog: DialogState, invoker?: HTMLElement | null) => {
    dialogReturnFocusRef.current = invoker || (document.activeElement as HTMLElement | null);
    setDialog(nextDialog);
  };

  const requestSignOut = (invoker: HTMLElement) => {
    if (pending) openDialog({ kind: "sign-out" }, invoker);
    else invoke(actions.onSignOut);
  };

  const openCamera = (origin?: HTMLElement | null) => {
    cameraButtonRef.current = origin || (document.activeElement as HTMLElement | null);
    setCameraOpen(true);
  };

  const beginDeleteChat = (chatId: string) => {
    if (deletingChatIds.has(chatId)) return;
    setLocalDeletingChatIds((current) => current.includes(chatId) ? current : [...current, chatId]);
    void Promise.resolve()
      .then(() => actions.onDeleteChat(chatId))
      .catch(() => undefined)
      .finally(() => {
        setLocalDeletingChatIds((current) => current.filter((id) => id !== chatId));
      });
  };

  const sidebarProps: SidebarContentProps = {
    view,
    actions,
    activeChat,
    deletingChatIds,
    onRename: (chat, invoker) => openDialog({ kind: "rename-chat", chat }, invoker),
    onDelete: (chat, invoker) => openDialog({ kind: "delete-chat", chat }, invoker),
    onLeaveGuest: (invoker) => openDialog({ kind: "leave-guest" }, invoker),
    onSignOut: requestSignOut
  };

  return (
    <div className={cx("ss-app", sidebarCollapsed && !mobileOrTablet && "ss-app--sidebar-collapsed")}>
      <a
        className="ss-skip-link"
        href="#active-conversation"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("active-conversation")?.focus();
        }}
      >
        Skip to active conversation
      </a>
      <aside className="ss-sidebar" aria-label="Conversation navigation"><SidebarContent {...sidebarProps} /></aside>
      <div className="ss-workspace">
        <div className="ss-header-wrap">
          <AppHeader
            view={view}
            activeChat={activeChat}
            sidebarCollapsed={sidebarCollapsed}
            mobileNavigation={mobileOrTablet}
            navigationExpanded={mobileOrTablet ? drawerOpen : !sidebarCollapsed}
            cameraOpen={cameraOpen}
            navigationButtonRef={navigationButtonRef}
            onToggleNavigation={() => mobileOrTablet ? setDrawerOpen(true) : setSidebarCollapsed((value) => !value)}
            onOpenCamera={() => openCamera()}
          />
        </div>
        <Conversation
          view={view}
          actions={actions}
          activeChat={activeChat}
          deletingActiveChat={deletingActiveChat}
          draft={activeDraft}
          onDraftChange={(value) => activeChat && setDrafts((current) => ({ ...current, [activeChat.id]: value }))}
          onOpenCamera={() => openCamera()}
          cameraOpen={cameraOpen}
          onDialog={openDialog}
          extraAnnouncement={announcement}
          onAnnouncement={(message) => { setAnnouncement(""); window.requestAnimationFrame(() => setAnnouncement(message)); }}
        />
        <CameraSurface
          open={cameraOpen}
          view={view}
          actions={actions}
          onClose={() => setCameraOpen(false)}
          returnFocusRef={cameraButtonRef}
        />
      </div>

      <Overlay
        open={drawerOpen}
        titleId="mobile-drawer-title"
        className="ss-drawer-overlay"
        onClose={() => setDrawerOpen(false)}
        returnFocusRef={navigationButtonRef}
      >
        <h2 id="mobile-drawer-title" className="ss-visually-hidden">Conversations</h2>
        <SidebarContent {...sidebarProps} onClose={() => setDrawerOpen(false)} />
      </Overlay>

      {dialog.kind === "rename-chat" && <RenameChatDialog dialog={dialog} actions={actions} onClose={() => setDialog({ kind: "none" })} returnFocusRef={dialogReturnFocusRef} />}
      {dialog.kind === "delete-chat" && (
        <ConfirmDialog
          title={`Delete “${dialog.chat.title}”?`}
          body={copy.chat.deleteBody(dialog.chat.messages.length)}
          confirmLabel={copy.chat.delete}
          onClose={() => setDialog({ kind: "none" })}
          onConfirm={() => beginDeleteChat(dialog.chat.id)}
          returnFocusRef={dialogReturnFocusRef}
        />
      )}
      {dialog.kind === "delete-message" && (
        <ConfirmDialog
          title={copy.message.deleteTitle}
          body={copy.message.deleteBody}
          confirmLabel={copy.common.delete}
          onClose={() => setDialog({ kind: "none" })}
          onConfirm={() => invoke(() => actions.onDeleteMessage(dialog.message))}
          returnFocusRef={dialogReturnFocusRef}
        />
      )}
      {dialog.kind === "edit-message" && <EditMessageDialog dialog={dialog} actions={actions} onClose={() => setDialog({ kind: "none" })} returnFocusRef={dialogReturnFocusRef} />}
      {dialog.kind === "leave-guest" && (
        <ConfirmDialog
          title={copy.guest.leaveTitle}
          body={copy.guest.leaveBody}
          confirmLabel={copy.guest.leaveDemo}
          cancelLabel={copy.guest.keepDemo}
          onClose={() => setDialog({ kind: "none" })}
          onConfirm={() => invoke(actions.onLeaveGuest)}
          returnFocusRef={dialogReturnFocusRef}
        />
      )}
      {dialog.kind === "sign-out" && (
        <ConfirmDialog
          title={copy.common.signOutTitle}
          body={copy.common.signOutBody}
          confirmLabel={copy.common.signOut}
          onClose={() => setDialog({ kind: "none" })}
          onConfirm={() => invoke(actions.onSignOut)}
          returnFocusRef={dialogReturnFocusRef}
        />
      )}
    </div>
  );
}

/**
 * Detection-independent persistent help affordance.
 *
 * Rendered in every session state and never conditioned on message content,
 * safety routing, or expression estimates, so it stays reachable when the
 * router routes nothing. It records nothing, invokes no action, performs no
 * network call, and stores nothing: opening it is not an event.
 *
 * Copy provenance:
 * - `label` is a neutral, non-imperative noun granted by the PM after review.
 *   It is deliberately NOT `copy.safety.title`, and the icon is deliberately
 *   NOT the routed SafetyActionCard's ShieldCheck, so the permanent strip does
 *   not wear the detection-triggered surface's identity.
 * - The two paragraphs are the two sentences of the reviewed
 *   `violence_or_immediate_danger` response text in `server/safety.ts`,
 *   reproduced verbatim. `tests/accessibility/persistent-help.test.tsx` reads
 *   `server/safety.ts` and fails if either side drifts.
 *
 * No versioned copy constant is added and neither SAFETY_COPY_VERSION nor
 * SAFETY_POLICY_VERSION is touched.
 */
const persistentHelpCopy = {
  label: "Help",
  skipLink: "Skip to help",
  immediateDanger:
    "If you or someone else may be harmed now, contact local emergency services or move to a safer place with a trusted person nearby.",
  boundary: "Emotional Friend is not monitored and cannot provide emergency care."
} as const;

/**
 * Static ids so the bypass link can target the trigger without threading a
 * generated id across the tree. Exactly one PersistentHelp renders per app,
 * matching the existing static-id convention (`active-conversation`,
 * `safety-card-title`).
 */
const PERSISTENT_HELP_TRIGGER_ID = "persistent-help-trigger";
const PERSISTENT_HELP_PANEL_ID = "persistent-help-panel";

function PersistentHelp() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <section
      className="ss-help-affordance"
      aria-labelledby={PERSISTENT_HELP_TRIGGER_ID}
      data-persistent-help="true"
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key !== "Escape" || !open) return;
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }}
    >
      <div className="ss-help-affordance__anchor">
        <button
          ref={triggerRef}
          id={PERSISTENT_HELP_TRIGGER_ID}
          className="ss-help-affordance__trigger"
          type="button"
          aria-expanded={open}
          aria-controls={PERSISTENT_HELP_PANEL_ID}
          onClick={() => setOpen((value) => !value)}
        >
          <CircleHelp size={18} aria-hidden="true" />
          <span>{persistentHelpCopy.label}</span>
        </button>
        <div
          id={PERSISTENT_HELP_PANEL_ID}
          className="ss-help-affordance__panel"
          hidden={!open}
        >
          <p>{persistentHelpCopy.immediateDanger}</p>
          <p>{persistentHelpCopy.boundary}</p>
          <button
            className="ss-help-affordance__close"
            type="button"
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            {copy.common.close}
          </button>
        </div>
      </div>
    </section>
  );
}

export function AppView({ view, actions }: AppViewProps) {
  const [sessionAnnouncement, setSessionAnnouncement] = useState("");

  useEffect(() => {
    setSessionAnnouncement(
      view.session === "guest-expired"
        ? copy.guest.expiredBody
        : ""
    );
  }, [view.session]);

  let experience: ReactNode;
  if (view.session === "initializing") experience = <LoadingScreen />;
  else if (view.session === "guest-expired") experience = <GuestExpiredScreen view={view} actions={actions} />;
  else if (view.session === "anonymous") experience = <AuthExperience view={view} actions={actions} />;
  else experience = <AppShell view={view} actions={actions} />;

  return (
    <>
      <a
        className="ss-skip-link ss-skip-link--help"
        href={`#${PERSISTENT_HELP_TRIGGER_ID}`}
        onClick={(event) => {
          event.preventDefault();
          document.getElementById(PERSISTENT_HELP_TRIGGER_ID)?.focus();
        }}
      >
        {persistentHelpCopy.skipLink}
      </a>
      <div
        className="ss-visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-session-status="true"
      >
        {sessionAnnouncement}
      </div>
      {experience}
      <PersistentHelp />
    </>
  );
}

export default AppView;
