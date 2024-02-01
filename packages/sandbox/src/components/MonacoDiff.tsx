import { Text } from '@bos-web-engine/ui';
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
    <div className={s.wrapper} data-monaco="diff">
      <div className={s.header}>
        <div className={s.headerSection}>
          <Text size="xs">On Chain:</Text>
        </div>
        <div className={s.headerSection}>
          <Text size="xs">Modified:</Text>
        </div>
      </div>

      <DiffEditor
        className="monaco-editor"
        theme="vs-dark"
        language="typescript"
        original={publishedFile?.source}
        originalModelPath="diff-original.tsx"
        modified={activeFile?.source}
        modifiedModelPath="diff-modified.tsx"
        options={{
          readOnly: true,
        }}
      />
    </div>
  );
}
