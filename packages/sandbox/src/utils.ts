export function convertSandpackFilePathToComponentName(
  sandpackFilePath: string
) {
  // Input: "/MyFolder/MyFile.tsx"
  // Output: "MyFolder.MyFile"

  const componentName = sandpackFilePath
    .split('.')
    .slice(0, -1)
    .join('') // Remove file extension
    .replace(/^\//, '') // Remove prefixed "/"
    .replace(/\//g, '.'); // Replace all other "/" with "."

  return componentName;
}
