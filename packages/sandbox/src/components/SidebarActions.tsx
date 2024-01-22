import { NearIconSvg, Tooltip } from '@bos-web-engine/ui';
import { useMonaco } from '@monaco-editor/react';
import {
  Plus,
  Code,
  Eye,
  BracketsCurly,
  BookOpenText,
} from '@phosphor-icons/react';

import { GitHubIconSvg } from './GitHubIconSvg';
import s from './SidebarActions.module.css';
import { NEW_COMPONENT_TEMPLATE } from '../constants';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { PanelType } from '../types';
import { returnUniqueFilePath } from '../utils';

type Props = {
  expandedPanel: PanelType | null;
  onSelectExpandPanel: (panel: PanelType | null) => void;
};

export function SidebarActions({ expandedPanel, onSelectExpandPanel }: Props) {
  const monaco = useMonaco();
  const editors = monaco?.editor.getEditors();
  const editor = editors && editors[Math.max(editors.length - 1, 0)];
  const containerElement = useSandboxStore((store) => store.containerElement);
  const files = useSandboxStore((store) => store.files);
  const setActiveFile = useSandboxStore((store) => store.setActiveFile);
  const setEditingFileName = useSandboxStore(
    (store) => store.setEditingFileName
  );
  const setFile = useSandboxStore((store) => store.setFile);

  const addNewComponent = () => {
    const filePath = returnUniqueFilePath(files, 'Untitled', 'tsx');
    setFile(filePath, {
      source: NEW_COMPONENT_TEMPLATE.source,
    });
    setActiveFile(filePath);
    setEditingFileName(filePath);
  };

  const formatCode = () => {
    const actionName = 'editor.action.formatDocument';
    const action = editor?.getAction(actionName);

    if (!action) {
      console.warn(`Action not found ${actionName}`);
      return;
    }

    action.run();
  };

  return (
    <div className={s.wrapper}>
      <Tooltip
        content="Create New Component"
        side="right"
        sideOffset={10}
        container={containerElement}
      >
        <button className={s.action} type="button" onClick={addNewComponent}>
          <Plus />
        </button>
      </Tooltip>

      <Tooltip
        content="Format Code"
        side="right"
        sideOffset={10}
        container={containerElement}
      >
        <button className={s.action} type="button" onClick={formatCode}>
          <BracketsCurly />
        </button>
      </Tooltip>

      <Tooltip
        content="Toggle Editor Panel View"
        side="right"
        sideOffset={10}
        container={containerElement}
      >
        <button
          className={s.action}
          type="button"
          onClick={() =>
            onSelectExpandPanel(expandedPanel === 'EDITOR' ? null : 'EDITOR')
          }
        >
          <Code />
        </button>
      </Tooltip>

      <Tooltip
        content="Toggle Preview Panel View"
        side="right"
        sideOffset={10}
        container={containerElement}
      >
        <button
          className={s.action}
          type="button"
          onClick={() =>
            onSelectExpandPanel(expandedPanel === 'PREVIEW' ? null : 'PREVIEW')
          }
        >
          <Eye />
        </button>
      </Tooltip>

      <Tooltip
        content="Sandbox Docs"
        side="right"
        sideOffset={10}
        container={containerElement}
      >
        <a className={s.action} href="/help" target="_blank">
          <BookOpenText />
        </a>
      </Tooltip>

      <Tooltip
        content="View this project on GitHub"
        side="right"
        sideOffset={10}
      >
        <a
          className={s.action}
          href="https://github.com/near/bos-web-engine"
          target="_blank"
          style={{ marginTop: 'auto' }}
          rel="noreferrer"
        >
          <GitHubIconSvg />
        </a>
      </Tooltip>

      <Tooltip
        content="Powered by NEAR"
        side="right"
        sideOffset={10}
        container={containerElement}
      >
        <a
          className={s.action}
          href="https://near.org"
          target="_blank"
          rel="noreferrer"
        >
          <NearIconSvg />
        </a>
      </Tooltip>
    </div>
  );
}
