import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import { emmetJSX } from 'emmet-monaco-es';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Loading } from './Loading';
import { MONACO_EXTERNAL_LIBRARIES } from '../constants';
import { useActiveFile } from '../hooks/useActiveFile';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { autoCloseHtmlTags } from '../monaco/auto-close-html-tags';
import type { MonacoExternalLibrary } from '../types';

const Wrapper = styled.div`
  flex: 1 0 auto;
  min-width: 0;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);

  &[data-loading='true'] {
    .monaco-editor {
      position: absolute;
      opacity: 0;
    }
  }
`;

export function MonacoEditor() {
  const { activeFile, activeFilePath } = useActiveFile();
  const setFile = useSandboxStore((store) => store.setFile);
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

  const beforeMonacoMount: BeforeMount = (monaco) => {
    emmetJSX(monaco, ['javascript', 'typescript']);

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

  const onMonacoMount: OnMount = (editor, monaco) => {
    setMounted(true);
    autoCloseHtmlTags(editor, monaco);
  };

  return (
    <Wrapper data-loading={isLoading}>
      {isLoading && <Loading message="Loading IDE environment..." />}

      {libraries && activeFilePath && activeFile && (
        <Editor
          className="monaco-editor"
          theme="vs-dark"
          language="typescript"
          path={activeFilePath}
          value={activeFile.source}
          beforeMount={beforeMonacoMount}
          options={{
            minimap: { enabled: false },
          }}
          onChange={(source) => {
            setFile(activeFilePath, {
              source: source ?? '',
            });
          }}
          onMount={onMonacoMount}
        />
      )}
    </Wrapper>
  );
}
