import { useMonaco } from '@monaco-editor/react';
import { Plus, Code, Eye, BracketsCurly } from '@phosphor-icons/react';
import styled from 'styled-components';

import { Tooltip } from './Tooltip';
import { NEW_COMPONENT_TEMPLATE } from '../constants';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { PanelType } from '../types';
import { returnUniqueFilePath } from '../utils';

type Props = {
  expandedPanel: PanelType | null;
  onSelectExpandPanel: (panel: PanelType | null) => void;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  position: relative;
  z-index: 20;
  width: 2.5rem;
  flex-shrink: 0;
  padding: 0.5rem 0;
  box-shadow: 3px 0 3px rgba(0, 0, 0, 0.15);
`;

const Action = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  color: var(--color-text-1);
  cursor: pointer;

  svg {
    fill: currentColor;
  }

  &:hover {
    background: var(--color-surface-3);
  }

  &:focus {
    box-shadow: inset 0 0 0 1px var(--color-border-1);
  }
`;

export function SidebarActions({ expandedPanel, onSelectExpandPanel }: Props) {
  const monaco = useMonaco();
  const editors = monaco?.editor.getEditors();
  const editor = editors && editors[Math.max(editors.length - 1, 0)];
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
    <Wrapper>
      <Tooltip content="Create New Component" side="right">
        <Action type="button" onClick={addNewComponent}>
          <Plus />
        </Action>
      </Tooltip>

      <Tooltip content="Format Code" side="right">
        <Action type="button" onClick={formatCode}>
          <BracketsCurly />
        </Action>
      </Tooltip>

      <Tooltip content="Toggle Editor Panel View" side="right">
        <Action
          type="button"
          onClick={() =>
            onSelectExpandPanel(expandedPanel === 'EDITOR' ? null : 'EDITOR')
          }
        >
          <Code />
        </Action>
      </Tooltip>

      <Tooltip content="Toggle Preview Panel View" side="right">
        <Action
          type="button"
          onClick={() =>
            onSelectExpandPanel(expandedPanel === 'PREVIEW' ? null : 'PREVIEW')
          }
        >
          <Eye />
        </Action>
      </Tooltip>
    </Wrapper>
  );
}
