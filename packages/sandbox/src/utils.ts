import { SandboxFiles } from './hooks/useSandboxStore';

export function convertFilePathToComponentName(filePath: string) {
  // Input: "MyFolder/MyFile.tsx"
  // Output: "MyFolder.MyFile"

  const componentName = filePath
    .split('.')
    .slice(0, -1)
    .join('') // Remove file extension
    .replace(/\//g, '.'); // Replace all other "/" with "."

  return componentName;
}

export function returnUniqueFilePath(
  files: SandboxFiles,
  desiredPath: string,
  fileExtension: string,
  _index = 0
): string {
  const uniquePath = _index > 0 ? `${desiredPath}${_index + 1}` : desiredPath;
  const paths = Object.keys(files);
  const isUnique = !paths.includes(`${uniquePath}.${fileExtension}`);

  if (isUnique) return `${uniquePath}.${fileExtension}`;

  return returnUniqueFilePath(files, desiredPath, fileExtension, _index + 1);
}

export function sortFiles(files: SandboxFiles) {
  const sorted: SandboxFiles = {};
  const paths = Object.keys(files).sort();

  paths.forEach((path) => {
    sorted[path] = files[path];
  });

  return sorted;
}
