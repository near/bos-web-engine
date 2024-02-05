import { useSandboxStore } from './useSandboxStore';

export function useActiveFile() {
  const activeFilePath = useSandboxStore((store) => store.activeFilePath);
  const files = useSandboxStore((store) => store.files);
  const activeFile = files[activeFilePath ?? ''];

  return {
    activeFile,
    activeFilePath,
  };
}
