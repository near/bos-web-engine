import { useState } from 'react';

import { FileExplorer } from './FileExplorer';
import s from './Layout.module.css';
import { MonacoDiff } from './MonacoDiff';
import { MonacoEditor } from './MonacoEditor';
import { Preview } from './Preview';
import { SidebarActions } from './SidebarActions';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { PanelType } from '../types';

export function Layout() {
  const [expandedPanel, setExpandedPanel] = useState<PanelType | null>(null);
  const mode = useSandboxStore((store) => store.mode);

  return (
    <div
      className={s.wrapper}
      data-expanded-panel={expandedPanel ?? ''}
      data-mode={mode}
    >
      <SidebarActions
        expandedPanel={expandedPanel}
        onSelectExpandPanel={setExpandedPanel}
      />

      <FileExplorer />

      {mode === 'EDIT' && <MonacoEditor />}
      {mode === 'PUBLISH' && <MonacoDiff />}

      <Preview />
    </div>
  );
}
