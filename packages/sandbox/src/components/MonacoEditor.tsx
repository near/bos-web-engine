import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import { emmetJSX } from 'emmet-monaco-es';
import { useEffect, useState } from 'react';

import { Loading } from './Loading';
import s from './MonacoEditor.module.css';
import { MONACO_EXTERNAL_LIBRARIES } from '../constants';
import { useActiveFile } from '../hooks/useActiveFile';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { autoCloseHtmlTags } from '../monaco/auto-close-html-tags';
import type { MonacoExternalLibrary } from '../types';

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

    /*
      TODO: Figure out why calling setCompilerOptions() triggers "Error: Could not find source file:
      'inmemory://model/X'." when <MonacoDiff> is shown
    */
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
    <div className={s.wrapper} data-loading={isLoading} data-monaco="editor">
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
    </div>
  );
}
