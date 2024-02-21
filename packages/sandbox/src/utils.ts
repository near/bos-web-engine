import {
  FileExtension,
  FILE_EXTENSION_REGEX,
  FILE_EXTENSIONS,
} from './constants';
import { SandboxFiles } from './hooks/useSandboxStore';

export function convertComponentNameToFilePath(
  componentName: string,
  fileExtension: FileExtension
) {
  // Input: "MyNamespace.MyFile"
  // Output: "MyNamespace/MyFile.tsx"

  const filePath = componentName.replace(/\./g, '/');

  return `${filePath}.${fileExtension}`;
}

export function convertFilePathToComponentName(filePath: string) {
  // Input: "MyFolder/MyFile.tsx"
  // Output: "MyFolder.MyFile"

  // Input: "MyFolder/MyFile.module.css"
  // Output: "MyFolder.MyFile"

  const componentName = filePath
    .replace(FILE_EXTENSION_REGEX, '')
    .replace(/\//g, '.');

  return componentName;
}

export function filePathIsComponent(filePath: string) {
  const fileExtension = filePath.split('.').pop() ?? '';
  return ['tsx'].includes(fileExtension);
}

export function normalizeFilePathAndExtension(filePath: string) {
  let filePathWithoutExtension = filePath.replace(FILE_EXTENSION_REGEX, '');
  let fileExtension = filePath.replace(
    filePathWithoutExtension,
    ''
  ) as FileExtension;

  if (!FILE_EXTENSIONS.includes(fileExtension)) {
    fileExtension = 'tsx';
  }

  // Convert all remaining "." to "/":
  filePathWithoutExtension = filePathWithoutExtension.replace(/\./g, '/');

  return {
    fileExtension,
    filePathWithoutExtension,
  };
}

export function returnUniqueFilePath(
  files: SandboxFiles,
  filePathWithoutExtension: string,
  fileExtension: string,
  _index = 0
): string {
  const uniquePath =
    _index > 0
      ? `${filePathWithoutExtension}${_index + 1}`
      : filePathWithoutExtension;
  const paths = Object.keys(files);
  const isUnique = !paths.includes(`${uniquePath}.${fileExtension}`);

  if (isUnique) return `${uniquePath}.${fileExtension}`;

  return returnUniqueFilePath(
    files,
    filePathWithoutExtension,
    fileExtension,
    _index + 1
  );
}

export function sortFiles(files: SandboxFiles) {
  const sorted: SandboxFiles = {};
  const paths = Object.keys(files).sort();

  paths.forEach((path) => {
    sorted[path] = files[path];
  });

  return sorted;
}
