import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { DEFAULT_FILES } from '../constants';
import { sortFiles } from '../utils';

export type SandboxFile = {
  source: string;
};

export type SandboxFiles = {
  [path: string]: SandboxFile | undefined;
};

type SandboxStore = {
  activeFilePath: string | undefined;
  containerElement: HTMLDivElement | undefined;
  editingFileNamePath: string | undefined;
  files: SandboxFiles;
  pinnedPreviewFilePath: string | undefined;

  removeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  setContainerElement: (element: HTMLDivElement | undefined) => void;
  setEditingFileName: (path: string | undefined) => void;
  setFile: (path: string, file: SandboxFile) => void;
  setFiles: (files: SandboxFiles) => void;
  setPinnedPreviewFile: (path: string | undefined) => void;
  updateFilePath: (currentPath: string, newPath: string) => void;
};

export const useSandboxStore = create<SandboxStore>()(
  persist(
    (set) => ({
      activeFilePath: Object.keys(DEFAULT_FILES).shift(),
      containerElement: undefined,
      editingFileNamePath: undefined,
      files: DEFAULT_FILES,
      pinnedPreviewFilePath: undefined,

      removeFile: (path) =>
        set((state) => {
          const files = { ...state.files };
          delete files[path];

          const firstFilePath = Object.keys(files)[0];

          const activeFilePath =
            state.activeFilePath === path
              ? firstFilePath
              : state.activeFilePath;

          const pinnedPreviewFilePath =
            state.pinnedPreviewFilePath === path
              ? undefined
              : state.pinnedPreviewFilePath;

          return {
            activeFilePath,
            files,
            pinnedPreviewFilePath,
          };
        }),

      setActiveFile: (activeFilePath) => set({ activeFilePath }),

      setContainerElement: (element) => set({ containerElement: element }),

      setEditingFileName: (path) => set({ editingFileNamePath: path }),

      setFile: (path, file) =>
        set((state) => {
          const files = {
            ...state.files,
            [path]: file,
          };

          return {
            files: sortFiles(files),
          };
        }),

      setFiles: (files) => set(() => ({ files: sortFiles(files) })),

      setPinnedPreviewFile: (path) => set({ pinnedPreviewFilePath: path }),

      updateFilePath: (currentPath, newPath) =>
        set((state) => {
          const currentFile = state.files[currentPath];
          const files = { ...state.files };

          if (currentFile) {
            const newFile = { ...currentFile };
            delete files[currentPath];
            files[newPath] = newFile;
          }

          return {
            files: sortFiles(files),
          };
        }),
    }),
    {
      name: 'bwe-sandbox-ide-store',
      storage: createJSONStorage(() => localStorage),
      partialize({ activeFilePath, files, pinnedPreviewFilePath }) {
        return {
          activeFilePath,
          files,
          pinnedPreviewFilePath,
        };
      },
    }
  )
);
