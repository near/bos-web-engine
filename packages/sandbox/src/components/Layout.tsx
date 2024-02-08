import { FileExplorer } from './FileExplorer';
import s from './Layout.module.css';
import { MonacoDiff } from './MonacoDiff';
import { MonacoEditor } from './MonacoEditor';
import { Preview } from './Preview';
import { SidebarActions } from './SidebarActions';
import { useSandboxStore } from '../hooks/useSandboxStore';

export function Layout() {
  const expandedEditPanel = useSandboxStore((store) => store.expandedEditPanel);
  const mode = useSandboxStore((store) => store.mode);

  return (
    <div
      className={s.wrapper}
      data-expanded-panel={expandedEditPanel}
      data-mode={mode}
    >
      <SidebarActions />

      <FileExplorer />

      <MonacoEditor />
      <MonacoDiff />

      <Preview />
    </div>
  );
}
