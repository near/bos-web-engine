import {
  useActiveCode,
  SandpackStack,
  FileTabs,
  useSandpack,
} from '@codesandbox/sandpack-react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Loading } from './Loading';
import { MONACO_EXTERNAL_LIBRARIES } from '../constants';
import { MonacoExternalLibrary } from '../types';

const Wrapper = styled.div`
  flex: 1 1 0;
  width: 100%;
  height: 100%;

  &[data-loading='true'] {
    .sp-stack {
      position: absolute;
      opacity: 0;
    }
  }
`;

export function MonacoEditor() {
  const { sandpack } = useSandpack();
  const { activeFile } = sandpack;
  const { code, updateCode } = useActiveCode();
  const [libraries, setLibraries] = useState<MonacoExternalLibrary[]>();
  const [mounted, setMounted] = useState(false);
  const isLoading = !mounted || !libraries;

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

  return (
    <Wrapper data-loading={isLoading}>
      {isLoading && <Loading message="Loading IDE environment..." />}

      {libraries && (
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
            onMount={() => setMounted(true)}
          />
        </SandpackStack>
      )}
    </Wrapper>
  );
}
