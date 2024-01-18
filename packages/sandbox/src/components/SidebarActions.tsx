import { useMonaco } from '@monaco-editor/react';
import {
  Plus,
  Code,
  Eye,
  BracketsCurly,
  BookOpenText,
} from '@phosphor-icons/react';
import styled from 'styled-components';

import { GitHubIconSvg } from './GitHubIconSvg';
import { NearIconSvg } from './NearIconSvg';
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
  width: 3rem;
  flex-shrink: 0;
  box-sizing: border-box;
  padding: 0.5rem 0;
  box-shadow: 3px 0 3px rgba(0, 0, 0, 0.15);
`;

const Action = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.25rem;
  color: var(--color-text-1);
  cursor: pointer;

  svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: currentColor;
  }

  &:hover {
    background: var(--color-surface-4);
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
      <Tooltip content="Create New Component" side="right" sideOffset={10}>
        <Action type="button" onClick={addNewComponent}>
          <Plus />
        </Action>
      </Tooltip>

      <Tooltip content="Format Code" side="right" sideOffset={10}>
        <Action type="button" onClick={formatCode}>
          <BracketsCurly />
        </Action>
      </Tooltip>

      <Tooltip content="Toggle Editor Panel View" side="right" sideOffset={10}>
        <Action
          type="button"
          onClick={() =>
            onSelectExpandPanel(expandedPanel === 'EDITOR' ? null : 'EDITOR')
          }
        >
          <Code />
        </Action>
      </Tooltip>

      <Tooltip content="Toggle Preview Panel View" side="right" sideOffset={10}>
        <Action
          type="button"
          onClick={() =>
            onSelectExpandPanel(expandedPanel === 'PREVIEW' ? null : 'PREVIEW')
          }
        >
          <Eye />
        </Action>
      </Tooltip>

      <Tooltip content="Sandbox Docs" side="right" sideOffset={10}>
        <Action as="a" href="/help" target="_blank">
          <BookOpenText />
        </Action>
      </Tooltip>

      <Tooltip
        content="View this project on GitHub"
        side="right"
        sideOffset={10}
      >
        <Action
          as="a"
          href="https://github.com/near/bos-web-engine"
          target="_blank"
          style={{ marginTop: 'auto' }}
        >
          <GitHubIconSvg />
        </Action>
      </Tooltip>

      <Tooltip content="Powered by NEAR" side="right" sideOffset={10}>
        <Action as="a" href="https://near.org" target="_blank">
          <NearIconSvg />
        </Action>
      </Tooltip>
    </Wrapper>
  );
}
