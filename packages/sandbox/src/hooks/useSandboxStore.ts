import { create } from 'zustand';

import { DEFAULT_FILES } from '../constants';

export type SandboxFile = {
  source: string;
};

export type SandboxFiles = {
  [path: string]: SandboxFile | undefined;
};

type SandboxStore = {
  editFilePathName: string | undefined;
  activeFilePath: string | undefined;
  files: SandboxFiles;
  id: string | undefined;

  removeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  setEditFileName: (path: string) => void;
  setId: (id: string) => void;
  setFile: (path: string, file: SandboxFile) => void;
  setFiles: (files: SandboxFiles) => void;
};

export const useSandboxStore = create<SandboxStore>()((set) => ({
  activeFilePath: Object.keys(DEFAULT_FILES).shift(),
  editFilePathName: undefined,
  files: DEFAULT_FILES,
  id: undefined,

  removeFile: (path) =>
    set((state) => {
      const files = { ...state.files };
      delete files[path];
      return {
        files,
      };
    }),

  setActiveFile: (activeFilePath) => set({ activeFilePath }),
  setEditFileName: (editFilePathName) => set({ editFilePathName }),
  setId: (id) => set({ id }),

  setFile: (path, file) =>
    set((state) => {
      return {
        files: {
          ...state.files,
          [path]: file,
        },
      };
    }),

  setFiles: (files) =>
    set(() => {
      return {
        files,
      };
    }),
}));
