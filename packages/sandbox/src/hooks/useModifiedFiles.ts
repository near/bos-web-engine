import { useMemo } from 'react';

import { useSandboxStore } from './useSandboxStore';

export function useModifiedFiles() {
  const files = useSandboxStore((store) => store.files);
  const isInitializingPublishedFiles = useSandboxStore(
    (store) => store.isInitializingPublishedFiles
  );
  const publishedFiles = useSandboxStore((store) => store.publishedFiles);

  const modifiedFilePaths = useMemo(() => {
    const result: string[] = [];

    if (isInitializingPublishedFiles) return result;

    Object.entries(files).forEach(([path, file]) => {
      if (!file) return;

      const publishedFile = publishedFiles[path];

      if (!publishedFile || publishedFile.source !== file.source) {
        result.push(path);
      }
    });

    return result;
  }, [files, isInitializingPublishedFiles, publishedFiles]);

  return {
    modifiedFilePaths,
  };
}
