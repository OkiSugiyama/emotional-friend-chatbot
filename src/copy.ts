export const copy = {
  brand: {
    name: "Emotional Friend",
    tagline: "A gentle space to talk things through.",
    welcome:
      "Share what’s on your mind and receive thoughtful, emotionally aware support. Camera-based expression context is always optional.",
    nonClinical:
      "Emotional Friend offers conversational support, not medical or emergency care."
  },
  auth: {
    welcomeBack: "Welcome back",
    google: "Continue with Google",
    googlePending: "Signing in with Google…",
    signIn: "Sign in",
    signingIn: "Signing in…",
    tryDemo: "Try demo mode",
    demoHelp:
      "Demo mode keeps the conversation on this device and clears it after 30 minutes of inactivity.",
    createAccount: "Create an account",
    createAccountTitle: "Create your account",
    creatingAccount: "Creating account…",
    forgotPassword: "Forgot password?",
    resetTitle: "Reset your password",
    resetHelp:
      "Enter the email you signed up with and we’ll send a reset link.",
    sendReset: "Send reset link",
    sendingReset: "Sending reset link…",
    resetConfirmationTitle: "Check your email",
    backToSignIn: "Back to sign in",
    resend: "Send it again",
    emailInvalid:
      "Enter a complete email address, for example name@example.com.",
    passwordShort: "Use at least 8 characters.",
    passwordMismatch: "The passwords don’t match.",
    passwordHelp: "At least 8 characters. Longer passphrases are stronger.",
    displayName: "Display name",
    optional: "optional",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password"
  },
  chat: {
    newChat: "New chat",
    noChatSelected: "No chat selected",
    noChatsTitle: "Nothing here yet",
    noChatsBody:
      "Start a conversation whenever you’re ready. You can delete a chat at any time.",
    startChat: "Start a new chat",
    emptyTitle: "What would you like to talk through?",
    emptyBody:
      "There’s no right way to start. A sentence is enough, and you can take as long as you like.",
    saved: "Saved to your account",
    localOnly: "Stored on this device only",
    loadError: "Couldn’t load your chats.",
    messagesLoadError: "Couldn’t load this conversation.",
    loadOlder: "Load older chats",
    loadOlderMessages: "Load earlier messages",
    deleting: "Deleting…",
    deletingCurrent: "Deleting this chat and its messages…",
    deletingAnnounce: (title: string) => `Deleting “${title}” and its messages.`,
    deletedAnnounce: (title: string) => `Deleted “${title}”.`,
    rename: "Rename chat",
    renameLabel: "Chat name",
    renameEmpty: "Names can’t be empty.",
    saveName: "Save name",
    delete: "Delete chat",
    keep: "Keep chat",
    deleteBody: (count: number) =>
      `This removes the chat and all ${count} ${count === 1 ? "message" : "messages"} in it. This can’t be undone.`
  },
  message: {
    youSaid: "You said",
    friendSaid: "Emotional Friend said",
    sending: "Sending…",
    writing: "Writing a reply…",
    copy: "Copy text",
    copied: "Message copied.",
    edit: "Edit and resend",
    editTitle: "Edit and resend message",
    delete: "Delete message",
    deleteTitle: "Delete this message?",
    deleteBody:
      "It will be removed from this conversation. Replies that were already written stay as they are.",
    keep: "Keep it",
    deleted: "Message deleted",
    undo: "Undo",
    failed: "I couldn’t reply just now. Your message is still here.",
    failedHelp: "Nothing was lost. Trying again won’t send your message twice.",
    retry: "Try again",
    returnToLatest: "Return to latest"
  },
  composer: {
    placeholder: "Write what’s on your mind…",
    desktopHint: "Enter sends · Shift+Enter adds a line",
    mobileHint: "Use the send button when you’re ready.",
    tooLong: "Messages can be up to 8,000 characters.",
    send: "Send message"
  },
  guest: {
    banner:
      "Demo mode · This conversation stays on this device and clears after 30 minutes of inactivity.",
    createToKeep: "Create an account to keep future conversations",
    migrationNote: "Nothing transfers automatically.",
    leaveDemo: "Leave demo and clear data",
    leaveTitle: "Leave demo and clear local data?",
    leaveBody:
      "All demo chats and messages stored on this device will be permanently cleared, and the camera will stop. This can’t be undone.",
    keepDemo: "Keep demo",
    expiredTitle: "Your demo session ended",
    expiredBody:
      "Demo conversations clear after 30 minutes of inactivity, and this one has been removed from this device. The camera was switched off too.",
    restart: "Start another demo"
  },
  camera: {
    title: "Expression context",
    off: "Expression context is off",
    on: "Expression context on",
    unavailable: "Expression estimate unavailable",
    firstUseTitle: "Before you turn on the camera",
    firstUse:
      "If you turn this on, your browser estimates facial expressions on this device. Video frames are not saved or sent to the assistant. Estimates can be wrong, and you can stop at any time.",
    microphone: "Only the camera is used. The microphone is never requested.",
    metadata:
      "Only the normalized expression label, a coarse confidence band, model version, and observation time can reach the assistant—never an image.",
    optional: "Chat works exactly the same with the camera off.",
    turnOn: "Turn on camera",
    notNow: "Not now",
    loading: "Preparing the expression model — about 3 MB, one time.",
    loadingHelp: "You can keep writing while this loads.",
    permissionPending: "Waiting for camera permission…",
    permissionHelp:
      "Your browser may ask whether this site can use the camera. Microphone access is not requested.",
    previewPending: "Preview starts once the model is ready",
    processedLocally: "Processed on this device. Frames are never saved or uploaded.",
    estimated: (label: string) => `Estimated expression: ${label}`,
    confidence: (band: string) => `${band} confidence · this is a guess, not a fact`,
    toneToggle: "Use this estimate to adjust reply tone",
    toneOnHelp: "Turning this off keeps the camera on for you only.",
    toneOffHelp: "The estimate stays on this device and never reaches the assistant.",
    stop: "Stop camera",
    cancel: "Cancel",
    noEstimate: "No estimate",
    noFaceTitle: "Nothing clear to read right now",
    noFaceBody:
      "Low light or an off-centre face is usually the reason. Nothing is being sent to the assistant while this is the case.",
    deniedTitle: "Your browser blocked camera access",
    deniedBody:
      "To use expression context, allow the camera for this site in your browser settings, then try again. You can keep chatting without it.",
    continueWithout: "Continue without it",
    retry: "Try again",
    errors: {
      "permission-denied": "Camera permission is blocked. Allow it in your browser settings, then try again, or keep chatting without it.",
      "no-device": "No camera was found. Connect one and try again, or keep chatting.",
      "in-use": "The camera is in use by another app. Close it, then try again.",
      unsupported: "This browser or connection can’t run local expression estimation.",
      "insecure-context": "Camera access requires a secure connection. You can keep chatting without it.",
      "model-load": "The expression model didn’t load. No estimate is shown or guessed.",
      inference: "Expression estimation stopped unexpectedly. No estimate is being sent.",
      unknown: "Expression context is unavailable right now. You can keep chatting without it."
    }
  },
  safety: {
    title: "Get help now",
    emergency: "Contact local emergency services",
    region: "Choose my country or region",
    regionLabel: "Country or region",
    regionPlaceholder: "Enter your country or region",
    showResources: "Show relevant support options",
    monitoring:
      "No one here is watching this conversation, and nothing has been reported anywhere.",
    reviewedOnly:
      "Region-specific resources appear only from the reviewed support catalogue.",
    regionUnavailable:
      "Reviewed region-specific resources aren’t available here yet. If you may be in immediate danger, contact local emergency services or ask a trusted nearby person to stay with you."
  },
  common: {
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    retry: "Try again",
    signOut: "Sign out",
    signOutTitle: "Sign out while a reply is pending?",
    signOutBody:
      "The pending reply will stop. Your saved conversations will not be deleted.",
    stay: "Stay here",
    loading: "Loading…",
    accountPrivacy: "Account & privacy",
    privacy: "Privacy notice",
    terms: "Terms"
  }
} as const;

export type CopyDeck = typeof copy;
