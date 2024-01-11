import {
  Plus,
  PencilSimple,
  Trash,
  Code,
  Eye,
  BracketsCurly,
  SquareSplitHorizontal,
} from '@phosphor-icons/react';
import styled from 'styled-components';

import { Tooltip } from './Tooltip';
import { PanelType } from '../types';

type Props = {
  expandedPanel: PanelType | null;
  onSelectExpandPanel: (panel: PanelType | null) => void;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  width: 2rem;
  flex-shrink: 0;
  padding: 0.25rem 0;
  background: #000;
`;

const Action = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  color: #fff;
  cursor: pointer;

  svg {
    fill: currentColor;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:focus {
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  }
`;

export function SidebarActions({ expandedPanel, onSelectExpandPanel }: Props) {
  return (
    <Wrapper>
      <Tooltip content="Create New Component" side="right">
        <Action type="button">
          <Plus />
        </Action>
      </Tooltip>

      <Tooltip content="Format Code" side="right">
        <Action type="button">
          <BracketsCurly />
        </Action>
      </Tooltip>

      <Tooltip content="Rename Selected Component" side="right">
        <Action type="button">
          <PencilSimple />
        </Action>
      </Tooltip>

      <Tooltip content="Delete Selected Component" side="right">
        <Action type="button">
          <Trash />
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
