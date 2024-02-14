import {
  SandboxFile,
  SandboxFileChildSourceType,
  useSandboxStore,
} from './useSandboxStore';

function useFileWithMonaco(
  filePath: string | undefined,
  file: SandboxFile | undefined,
  childSourceType?: SandboxFileChildSourceType
) {
  let language = 'typescript';
  let path = filePath ?? 'undefined.tsx';
  let value = file?.source;

  if (childSourceType === 'CSS') {
    language = 'scss';
    path += '.scss';
    value = file?.css;
  }

  return {
    path,
    language,
    value,
  };
}

export function useModifiedFileWithMonaco(
  filePath: string | undefined,
  childSourceType?: SandboxFileChildSourceType
) {
  const files = useSandboxStore((store) => store.files);
  const file = files[filePath ?? ''];
  const result = useFileWithMonaco(filePath, file, childSourceType);

  return result;
}

export function useOriginalFileWithMonaco(
  filePath: string | undefined,
  childSourceType?: SandboxFileChildSourceType
) {
  const publishedFiles = useSandboxStore((store) => store.publishedFiles);
  const file = publishedFiles[filePath ?? ''];
  const result = useFileWithMonaco(filePath, file, childSourceType);

  return result;
}
