import {
  File,
  DotsThreeVertical,
  Trash,
  PencilSimple,
} from '@phosphor-icons/react';
import styled from 'styled-components';

import * as Dropdown from './Dropdown';
import { useSandboxStore } from '../hooks/useSandboxStore';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 12rem;
  height: 100%;
  background: var(--color-surface-2);
  overflow: auto;
  scroll-behavior: smooth;
`;

const FileList = styled.ul`
  all: unset;
  display: block;
`;

const FileListItem = styled.li`
  all: unset;
  display: block;
`;

const FileMenuButton = styled.button`
  all: unset;
  display: none;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
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

  &[data-state='open'] {
    display: flex !important;
  }
`;

const FileButton = styled.button`
  all: unset;
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-primary);
  font-size: 0.8rem;
  line-height: 1.3;
  font-weight: 400;
  color: var(--color-text-1);
  padding: 0.25rem;
  padding-left: 0.5rem;
  box-sizing: border-box;
  cursor: pointer;
  min-width: 0;

  svg {
    flex-shrink: 0;
  }

  &[data-active='true'] {
    background: var(--color-surface-3);
  }

  &:hover {
    background: var(--color-surface-4);

    ${FileMenuButton} {
      display: flex;
    }
  }

  &:focus {
    box-shadow: inset 0 0 0 1px var(--color-border-1);
  }

  &:has([data-state='open']),
  &:has([contenteditable]) {
    background: var(--color-surface-primary);
    box-shadow: none;
  }
`;

const FileName = styled.span`
  display: block;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  text-overflow: ellipsis;
  padding: 0.25rem;
  box-sizing: border-box;
  min-width: 0;
  outline: none;
`;

export function FileExplorer() {
  const activeFilePath = useSandboxStore((store) => store.activeFilePath);
  const editFilePathName = useSandboxStore((store) => store.editFilePathName);
  const files = useSandboxStore((store) => store.files);
  const setActiveFile = useSandboxStore((store) => store.setActiveFile);

  return (
    <Wrapper>
      <FileList>
        {Object.keys(files).map((path) => (
          <FileListItem key={path}>
            <FileButton
              data-active={activeFilePath === path}
              type="button"
              title={path}
              onClick={() => setActiveFile(path)}
            >
              <File />

              <FileName
                contentEditable={
                  editFilePathName === path ? 'plaintext-only' : undefined
                }
                spellCheck="false"
              >
                {path}
              </FileName>

              <Dropdown.Root>
                <Dropdown.Trigger asChild>
                  <FileMenuButton type="button">
                    <DotsThreeVertical weight="bold" />
                  </FileMenuButton>
                </Dropdown.Trigger>

                <Dropdown.Content sideOffset={-5}>
                  <Dropdown.Item>
                    <PencilSimple />
                    Rename File
                  </Dropdown.Item>

                  <Dropdown.Item>
                    <Trash color="var(--color-danger)" />
                    Delete File
                  </Dropdown.Item>
                </Dropdown.Content>
              </Dropdown.Root>
            </FileButton>
          </FileListItem>
        ))}
      </FileList>
    </Wrapper>
  );
}
