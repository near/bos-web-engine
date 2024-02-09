import { Text } from '@bos-web-engine/ui';
import { DiffEditor } from '@monaco-editor/react';

import s from './MonacoDiff.module.css';
import {
  useModifiedFileWithMonaco,
  useOriginalFileWithMonaco,
} from '../hooks/useFileWithMonaco';
import { useMonacoTheme } from '../hooks/useMonacoTheme';
import { useSandboxStore } from '../hooks/useSandboxStore';

export function MonacoDiff() {
  const activeFilePath = useSandboxStore((store) => store.activeFilePath);
  const activeFileChildSourceType = useSandboxStore(
    (store) => store.activeFileChildSourceType
  );
  const originalFile = useOriginalFileWithMonaco(
    activeFilePath,
    activeFileChildSourceType
  );
  const modifiedFile = useModifiedFileWithMonaco(
    activeFilePath,
    activeFileChildSourceType
  );
  const monacoTheme = useMonacoTheme();

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
        language={modifiedFile.language}
        original={originalFile.value}
        originalModelPath={
          originalFile.path
            ? `diff-original-${originalFile.path}`
            : 'diff-original.tsx'
        }
        options={{
          readOnly: true,
        }}
        modified={modifiedFile.value}
        modifiedModelPath={
          modifiedFile.path
            ? `diff-modified-${modifiedFile.path}`
            : 'diff-modified.tsx'
        }
        theme={monacoTheme}
      />
    </div>
  );
}
