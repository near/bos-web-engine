import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import { emmetJSX } from 'emmet-monaco-es';
import { useEffect, useState } from 'react';

import { Loading } from './Loading';
import s from './MonacoEditor.module.css';
import { MONACO_EXTERNAL_LIBRARIES } from '../constants';
import { useModifiedFileWithMonaco } from '../hooks/useFileWithMonaco';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { autoCloseHtmlTags } from '../monaco/auto-close-html-tags';
import type { MonacoExternalLibrary } from '../types';

export function MonacoEditor() {
  const activeFilePath = useSandboxStore((store) => store.activeFilePath);
  const activeFileChildSourceType = useSandboxStore(
    (store) => store.activeFileChildSourceType
  );
  const modifiedFile = useModifiedFileWithMonaco(
    activeFilePath,
    activeFileChildSourceType
  );
  const files = useSandboxStore((store) => store.files);
  const setFile = useSandboxStore((store) => store.setFile);
  const [libraries, setLibraries] = useState<MonacoExternalLibrary[]>();
  const [mounted, setMounted] = useState(false);
  const [monacoInstance, setMonacoInstance] =
    useState<Parameters<BeforeMount>[0]>();
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

  useEffect(() => {
    const monaco = monacoInstance;
    if (!monaco) return;

    Object.entries(files).forEach(([filePath, file]) => {
      const model = monaco.editor.getModel(monaco.Uri.parse(filePath));

      if (file) {
        if (model) {
          if (activeFilePath !== filePath || model.getValue() !== file.source) {
            model.setValue(file.source);
          }
        } else {
          monaco.editor.createModel(
            file.source,
            'typescript',
            monaco.Uri.parse(filePath)
          );
        }
      } else if (model && !model.isDisposed) {
        model.dispose();
      }
    });
  }, [activeFilePath, files, monacoInstance]);

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

    setMonacoInstance(monaco);
  };

  const onMonacoMount: OnMount = (editor, monaco) => {
    setMounted(true);
    autoCloseHtmlTags(editor, monaco);
  };

  return (
    <div className={s.wrapper} data-loading={isLoading} data-monaco="editor">
      {isLoading && <Loading message="Loading IDE environment..." />}

      {libraries && activeFilePath && (
        <Editor
          className={s.monaco}
          beforeMount={beforeMonacoMount}
          onChange={(source) => {
            if (activeFileChildSourceType === 'CSS') {
              setFile(activeFilePath, {
                css: source,
              });
            } else {
              setFile(activeFilePath, {
                source,
              });
            }
          }}
          onMount={onMonacoMount}
          options={{
            minimap: { enabled: false },
          }}
          path={modifiedFile.path}
          theme="vs-light"
          /*
            NOTE: We need to pass in `language` and `value` props to automatically manage  
            models for non-typescript file types (like CSS):
          */
          language={modifiedFile.language}
          value={modifiedFile.value}
        />
      )}
    </div>
  );
}
