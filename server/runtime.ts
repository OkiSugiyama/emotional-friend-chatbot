import { createApiHandlers } from "./api-handlers.js";
import { AllowlistLogger } from "./logger.js";

const handlers = createApiHandlers({
  env: process.env,
  logger: new AllowlistLogger(),
});

export const healthHandler = handlers.health;
export const clientEventHandler = handlers.clientEvent;
export const guestSessionHandler = handlers.guestSession;
export const postMessageHandler = handlers.postMessage;
export const deleteChatHandler = handlers.deleteChat;
export const firebaseTokenHandler = handlers.firebaseToken;
export const dataSessionHandler = handlers.firebaseToken;
