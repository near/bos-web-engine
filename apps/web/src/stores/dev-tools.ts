import type {
  UseWebEngineSandboxParams,
  WebEngineFlags,
} from '@bos-web-engine/application';
import { create } from 'zustand';

interface SourcesState {
  flags: WebEngineFlags;
  updateFlags: (newFlags: WebEngineFlags) => void;

  devToolsLoaded: boolean;
  markDevToolsLoaded: () => void;

  localComponents: UseWebEngineSandboxParams['localComponents'] | null;
  localFetchStatus: LocalFetchStatus;
  setLocalFetchStatus: (status: LocalFetchStatus) => void;
}

export const useDevToolsStore = create<SourcesState>((set) => ({
  flags: {},
  updateFlags: (newFlags) =>
    set((state) => {
      // clear local components when switching to a different local loader
      let additional = {};
      if (
        Object.hasOwn(newFlags, 'bosLoaderUrl') &&
        newFlags.bosLoaderUrl !== state.flags.bosLoaderUrl
      ) {
        additional = {
          localComponents: null,
          localFetchStatus: LocalFetchStatus.NONE,
        };
      }

      const updated = { ...state.flags, ...newFlags };
      localStorage.setItem('flags', JSON.stringify(updated));
      return { flags: updated, ...additional };
    }),

  devToolsLoaded: false,
  markDevToolsLoaded: () => {
    set({ devToolsLoaded: true });
  },

  localComponents: null,
  localFetchStatus: LocalFetchStatus.NONE,
  setLocalFetchStatus: (status) => {
    set({ localFetchStatus: status });
  },
}));

export enum LocalFetchStatus {
  NONE,
  LOADING,
  SUCCESS,
  ERROR,
}
