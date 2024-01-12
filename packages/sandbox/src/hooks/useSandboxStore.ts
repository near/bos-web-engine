import { create } from 'zustand';

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
  editingFileNamePath: string | undefined;
  files: SandboxFiles;
  id: string | undefined;

  removeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  setEditingFileName: (path: string | undefined) => void;
  setId: (id: string) => void;
  setFile: (path: string, file: SandboxFile) => void;
  setFiles: (files: SandboxFiles) => void;
  updateFilePath: (currentPath: string, newPath: string) => void;
};

export const useSandboxStore = create<SandboxStore>()((set) => ({
  activeFilePath: Object.keys(DEFAULT_FILES).shift(),
  editingFileNamePath: undefined,
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

  setEditingFileName: (editFilePathName) =>
    set({ editingFileNamePath: editFilePathName }),

  setId: (id) => set({ id }),

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
}));
