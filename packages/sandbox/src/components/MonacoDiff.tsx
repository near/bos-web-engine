import { DiffEditor } from '@monaco-editor/react';

import s from './MonacoDiff.module.css';
import { useActiveFile } from '../hooks/useActiveFile';
import { useSandboxStore } from '../hooks/useSandboxStore';

export function MonacoDiff() {
  const { activeFile, activeFilePath } = useActiveFile();
  const publishedFiles = useSandboxStore((store) => store.publishedFiles);
  const publishedFile = activeFilePath
    ? publishedFiles[activeFilePath]
    : undefined;

  return (
    <div className={s.wrapper}>
      <DiffEditor
        className="monaco-editor"
        theme="vs-dark"
        language="typescript"
        original={publishedFile?.source}
        modified={activeFile?.source}
        options={{
          readOnly: true,
        }}
      />
    </div>
  );
}
