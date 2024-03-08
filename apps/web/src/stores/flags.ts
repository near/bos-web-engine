import type { WebEngineFlags } from '@bos-web-engine/application';
import { create } from 'zustand';

interface SourcesState {
  flags: WebEngineFlags;
  updateFlags: (newFlags: WebEngineFlags) => void;
}

export const useFlagsStore = create<SourcesState>((set) => ({
  flags: {},
  updateFlags: (newFlags) =>
    set((state) => {
      const updated = { ...state.flags, ...newFlags };
      localStorage.setItem('flags', JSON.stringify(updated));
      return { flags: updated };
    }),
}));
