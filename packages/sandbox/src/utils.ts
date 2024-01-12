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
