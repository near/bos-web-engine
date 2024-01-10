import {
  useActiveCode,
  SandpackStack,
  FileTabs,
  useSandpack,
} from '@codesandbox/sandpack-react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useEffect, useState } from 'react';

import { MONACO_EXTERNAL_LIBRARIES } from '../constants';
import { MonacoExternalLibrary } from '../types';

export function MonacoEditor() {
  const { sandpack } = useSandpack();
  const { activeFile } = sandpack;
  const { code, updateCode } = useActiveCode();
  const [libraries, setLibraries] = useState<MonacoExternalLibrary[]>();

  useEffect(() => {
    const loadSourceForLibrary = async (url?: string) => {
      try {
        if (!url) return;

        const response = await fetch(url);
        const blob = await response.blob();
        const source = await blob.text();

        if (!source) {
          throw new Error(`Failed to load source for library: ${url}`);
        }

        return source;
      } catch (error) {
        console.error(error);
      }
    };

    const loadAllLibraries = async () => {
      const result: MonacoExternalLibrary[] = await Promise.all(
        MONACO_EXTERNAL_LIBRARIES.map(async (library) => {
          const source =
            library.source ?? (await loadSourceForLibrary(library.url));
          return {
            ...library,
            source,
          };
        })
      );

      setLibraries(result);
    };

    loadAllLibraries();
  }, []);

  const beforeMonacoMount = (monaco: Monaco) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    });

    if (!libraries) {
      console.error(
        'Attempting to mount editor before libraries have finished loading.'
      );
      return;
    }

    libraries.forEach((library) => {
      if (!library.source) return;
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        library.source,
        library.resolutionPath
      );
    });
  };

  if (libraries) {
    return (
      <SandpackStack>
        <FileTabs closableTabs />

        <Editor
          theme="vs-dark"
          language="typescript"
          path={activeFile}
          value={code}
          beforeMount={beforeMonacoMount}
          options={{
            minimap: { enabled: false },
          }}
          onChange={(value) => updateCode(value || '')}
        />
      </SandpackStack>
    );
  } else {
    return <p>Loading IDE environment...</p>; // TODO: Prettier loading state
  }
}
