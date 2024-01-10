import {
  useActiveCode,
  SandpackStack,
  FileTabs,
  useSandpack,
} from '@codesandbox/sandpack-react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useEffect, useState } from 'react';

type Library = {
  resolutionPath: string;
  source?: string;
  url?: string;
};

const librariesToLoad: Library[] = [
  {
    resolutionPath: 'file:///node_modules/@types/react/index.d.ts',
    url: 'https://unpkg.com/@types/react@18.2.47/index.d.ts',
  },
  {
    resolutionPath: 'file:///node_modules/@types/react-dom/index.d.ts',
    url: 'https://unpkg.com/@types/react-dom@18.2.18/index.d.ts',
  },
  {
    resolutionPath: 'file:///node_modules/@types/react/jsx-runtime.d.ts',
    url: 'https://unpkg.com/@types/react@18.2.47/jsx-runtime.d.ts',
  },
  {
    resolutionPath: 'file:///globals.d.ts',
    source: `import {
      useState as useReactState,
      useEffect as useReactEffect,
      FunctionComponent,
    } from 'react';
    
    declare global {
      const useState: typeof useReactState;
      const useEffect: typeof useReactEffect;
      const props: any;
      const Component: FunctionComponent<{
        src: string;
        props?: any;
        trust?: { mode: string };
        id?: string;
      }>;
      const Widget: typeof Component;
    }`,
  },
];

export function MonacoEditor() {
  const { sandpack } = useSandpack();
  const { activeFile } = sandpack;
  const { code, updateCode } = useActiveCode();
  const [libraries, setLibraries] = useState<Library[]>();

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
      const result: Library[] = await Promise.all(
        librariesToLoad.map(async (library) => {
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
      lib: ['es6', 'dom'],
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
          options={{ minimap: { enabled: false } }}
          onChange={(value) => updateCode(value || '')}
        />
      </SandpackStack>
    );
  } else {
    return <p>Loading...</p>;
  }
}
