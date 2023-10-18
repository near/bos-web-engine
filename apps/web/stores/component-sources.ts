import { create } from 'zustand';

interface SourcesState {
  sources: Record<string, string>;
  addSource: (path: string, source: string) => void;
  clearSources: () => void;
}

export const useComponentSourcesStore = create<SourcesState>((set) => ({
  sources: {},
  addSource: (path, source) =>
    set((state) => ({ sources: { ...state.sources, [path]: source } })),
  clearSources: () => set({ sources: {} }),
}));
