import { useMemo } from 'react';

import { useSandboxStore } from './useSandboxStore';

export function useModifiedFiles() {
  const files = useSandboxStore((store) => store.files);
  const publishedFiles = useSandboxStore((store) => store.publishedFiles);

  const modifiedFilePaths = useMemo(() => {
    const result: string[] = [];

    Object.entries(files).forEach(([path, file]) => {
      if (!file) return;

      const publishedFile = publishedFiles[path];

      if (!publishedFile || publishedFile.source !== file.source) {
        result.push(path);
      }
    });

    return result;
  }, [files, publishedFiles]);

  return {
    modifiedFilePaths,
  };
}
