import { useReducer } from "react";
import {
  chatReducer,
  initialChatState,
  type ChatState,
} from "../domain/chat-reducer";

export function useChatState(initialState: ChatState = initialChatState) {
  return useReducer(chatReducer, initialState);
}

