import { useState } from 'react';

import { FileExplorer } from './FileExplorer';
import { FileOpener } from './FileOpener';
import s from './Layout.module.css';
import { MonacoDiff } from './MonacoDiff';
import { MonacoEditor } from './MonacoEditor';
import { Preview } from './Preview';
import { SidebarActions } from './SidebarActions';
import { useSandboxStore } from '../hooks/useSandboxStore';

export function Layout() {
  const expandedEditPanel = useSandboxStore((store) => store.expandedEditPanel);
  const mode = useSandboxStore((store) => store.mode);
  const [fileOpenerIsOpen, setFileOpenerIsOpen] = useState(false);

  return (
    <>
      {mode === 'EDIT' && (
        <FileOpener isOpen={fileOpenerIsOpen} setIsOpen={setFileOpenerIsOpen} />
      )}

      <div
        className={s.wrapper}
        data-expanded-panel={expandedEditPanel}
        data-mode={mode}
      >
        <SidebarActions showFileOpener={() => setFileOpenerIsOpen(true)} />
        <FileExplorer showFileOpener={() => setFileOpenerIsOpen(true)} />
        <MonacoEditor />
        <MonacoDiff />
        <Preview />
      </div>
    </>
  );
}
