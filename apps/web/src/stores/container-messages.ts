import type { BWEMessage } from '@bos-web-engine/application';
import { create } from 'zustand';

interface ContainerMessagesState {
  messages: BWEMessage[];
  addMessage: (message: BWEMessage) => void;
  clearMessages: () => void;
}

export const useContainerMessagesStore = create<ContainerMessagesState>(
  (set) => ({
    messages: [],
    addMessage: (message) =>
      set((state) => ({ messages: [...state.messages, message] })),
    clearMessages: () => set({ messages: [] }),
  })
);
