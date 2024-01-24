import { useState } from 'react';

import { FileExplorer } from './FileExplorer';
import s from './Layout.module.css';
import { MonacoEditor } from './MonacoEditor';
import { Preview } from './Preview';
import { SidebarActions } from './SidebarActions';
import { PanelType } from '../types';

export function Layout() {
  const [expandedPanel, setExpandedPanel] = useState<PanelType | null>(null);

  return (
    <div className={s.wrapper} data-expanded-panel={expandedPanel ?? ''}>
      <SidebarActions
        expandedPanel={expandedPanel}
        onSelectExpandPanel={setExpandedPanel}
      />

      <FileExplorer />

      <MonacoEditor />

      <Preview />
    </div>
  );
}
