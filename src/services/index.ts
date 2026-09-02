/**
 * Public client-domain facade.
 *
 * UI code should import from this module rather than reaching into Firebase,
 * localStorage, face-api, or HTTP implementation files directly.
 */
import type { FirebaseOptions } from "firebase/app";
import { GuestSessionStore } from "../domain/guest-storage";
import { createFirebaseClient, type FirebaseClient } from "./firebase-client";
import { ClerkFirebaseBridge } from "./clerk-firebase-bridge";
import {
  FirestoreChatRepository,
  type TrustedCascadeDelete,
} from "./firestore-repository";
import { HttpChatClient, type HttpChatClientOptions } from "./http-chat-client";
import { LocalCameraExpressionAdapter } from "./camera-expression-adapter";
import { RegisteredChatCrudService } from "./chat-crud";
import { SessionLifecycleService } from "./session-lifecycle";

export interface ClientServices {
  firebase: FirebaseClient;
  auth: ClerkFirebaseBridge;
  guestStorage: GuestSessionStore;
  chatGeneration: HttpChatClient;
  camera: LocalCameraExpressionAdapter;
  session: SessionLifecycleService;
  forRegisteredUser(uid: string, cascadeDelete: TrustedCascadeDelete): {
    repository: FirestoreChatRepository;
    chats: RegisteredChatCrudService;
  };
}

export interface CreateClientServicesOptions {
  firebase: FirebaseOptions;
  firebaseAppName?: string;
  http?: HttpChatClientOptions;
}

export function createClientServices(options: CreateClientServicesOptions): ClientServices {
  const firebase = createFirebaseClient(options.firebase, options.firebaseAppName);
  const guestStorage = new GuestSessionStore();
  const chatGeneration = new HttpChatClient(options.http);
  const camera = new LocalCameraExpressionAdapter();
  const auth = new ClerkFirebaseBridge(firebase.auth);
  const session = new SessionLifecycleService(auth, guestStorage, camera);

  return {
    firebase,
    auth,
    guestStorage,
    chatGeneration,
    camera,
    session,
    forRegisteredUser(uid, cascadeDelete) {
      const repository = new FirestoreChatRepository(firebase.firestore, uid, cascadeDelete);
      return { repository, chats: new RegisteredChatCrudService(repository) };
    },
  };
}

export * from "./camera-expression-adapter";
export * from "./chat-crud";
export * from "./clerk-firebase-bridge";
export * from "./firebase-client";
export * from "./firestore-repository";
export * from "./http-chat-client";
export * from "./reliability";
export * from "./session-lifecycle";
