import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { DEFAULT_FILES, NEW_COMPONENT_TEMPLATE } from '../constants';
import { returnUniqueFilePath, sortFiles } from '../utils';

export type SandboxFile = {
  css?: string;
  source: string;
};

export type SandboxFiles = {
  [path: string]: SandboxFile | undefined;
};

type SandboxMode = 'EDIT' | 'PUBLISH';
type SandboxModeEditPanelType = 'SOURCE' | 'PREVIEW';
export type SandboxFileChildSourceType = 'CSS';

type SandboxStore = {
  activeFileChildSourceType: SandboxFileChildSourceType | undefined;
  activeFilePath: string | undefined;
  containerElement: HTMLDivElement | undefined;
  editingFileNamePath: string | undefined;
  expandedEditPanel: SandboxModeEditPanelType | undefined;
  files: SandboxFiles;
  isInitializingPublishedFiles: boolean;
  mode: SandboxMode;
  pinnedPreviewFilePath: string | undefined;
  publishedFiles: SandboxFiles;

  addNewFile: () => void;
  removeFile: (path: string) => void;
  resetAllFiles: () => void;
  setActiveFile: (
    path: string,
    childSourceType?: SandboxFileChildSourceType
  ) => void;
  setContainerElement: (element: HTMLDivElement | undefined) => void;
  setEditingFileName: (path: string | undefined) => void;
  setExpandedEditPanel: (panel: SandboxModeEditPanelType | undefined) => void;
  setFile: (path: string, partialFile: Partial<SandboxFile>) => void;
  setFiles: (files: SandboxFiles) => void;
  setMode: (mode: SandboxMode) => void;
  setPinnedPreviewFile: (path: string | undefined) => void;
  setPublishedFiles: (files: SandboxFiles) => void;
  updateFilePath: (currentPath: string, newPath: string) => void;
};

export const useSandboxStore = create<SandboxStore>()(
  persist(
    (set, get) => ({
      activeFileChildSourceType: undefined,
      activeFilePath: Object.keys(DEFAULT_FILES).shift(),
      containerElement: undefined,
      editingFileNamePath: undefined,
      expandedEditPanel: undefined,
      isInitializingPublishedFiles: true,
      files: DEFAULT_FILES,
      mode: 'EDIT',
      pinnedPreviewFilePath: undefined,
      publishedFiles: {},

      addNewFile: () => {
        const state = get();
        const path = returnUniqueFilePath(state.files, 'Untitled', 'tsx');
        state.setFile(path, NEW_COMPONENT_TEMPLATE);
        state.setActiveFile(path);
        state.setEditingFileName(path);
      },

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

      resetAllFiles: () =>
        set({
          activeFilePath: Object.keys(DEFAULT_FILES).shift(),
          activeFileChildSourceType: undefined,
          editingFileNamePath: undefined,
          files: DEFAULT_FILES,
          pinnedPreviewFilePath: undefined,
        }),

      setActiveFile: (activeFilePath, activeFileChildSourceType) =>
        set({ activeFilePath, activeFileChildSourceType }),

      setContainerElement: (containerElement) => set({ containerElement }),

      setEditingFileName: (editingFileNamePath) => set({ editingFileNamePath }),

      setExpandedEditPanel: (expandedEditPanel) => set({ expandedEditPanel }),

      setFile: (path, partialFile) =>
        set((state) => {
          const existingFile = state.files[path];
          const updatedFile = {
            ...existingFile,
            ...partialFile,
          };

          if (JSON.stringify(existingFile) === JSON.stringify(updatedFile)) {
            // If the file hasn't changed, don't update the files object
            return {};
          }

          const files = {
            ...state.files,
            [path]: {
              css: updatedFile.css,
              source: updatedFile.source ?? '',
            },
          };

          return {
            files: sortFiles(files),
          };
        }),

      setFiles: (files) => set(() => ({ files: sortFiles(files) })),

      setMode: (mode) => set({ mode }),

      setPinnedPreviewFile: (pinnedPreviewFilePath) =>
        set({ pinnedPreviewFilePath }),

      setPublishedFiles: (publishedFiles) =>
        set(() => ({ isInitializingPublishedFiles: false, publishedFiles })),

      updateFilePath: (currentPath, newPath) =>
        set((state) => {
          const currentFile = state.files[currentPath];
          const files = { ...state.files };

          if (currentFile) {
            delete files[currentPath];
            files[newPath] = { ...currentFile };
          }

          return {
            files: sortFiles(files),
          };
        }),
    }),
    {
      name: 'bwe-sandbox-ide-store',
      storage: createJSONStorage(() => localStorage),
      partialize({
        activeFilePath,
        activeFileChildSourceType,
        expandedEditPanel,
        files,
        pinnedPreviewFilePath,
      }) {
        return {
          activeFilePath,
          activeFileChildSourceType,
          expandedEditPanel,
          files,
          pinnedPreviewFilePath,
        };
      },
    }
  )
);
