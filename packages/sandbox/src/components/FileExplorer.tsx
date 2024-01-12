import {
  File,
  DotsThreeVertical,
  Trash,
  PencilSimple,
} from '@phosphor-icons/react';
import { useEffect } from 'react';
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

const FileDropdownButton = styled.button`
  all: unset;
  display: none;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  flex-shrink: 0;
  color: var(--color-text-1);
  cursor: pointer;
  background: none;

  svg {
    fill: currentColor;
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
  background: none;

  svg {
    flex-shrink: 0;
  }
`;

const FileListItem = styled.li`
  all: unset;
  display: flex;
  min-width: 0;
  align-items: stretch;

  &:hover {
    background: var(--color-surface-4);

    ${FileDropdownButton} {
      display: flex;
    }
  }

  &:has([data-state='open']),
  &:has([contenteditable]) {
    background: var(--color-surface-primary);
    box-shadow: none;
  }

  &:focus-within {
    box-shadow: inset 0 0 0 1px var(--color-border-1);
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
  const removeFile = useSandboxStore((store) => store.removeFile);
  const setActiveFile = useSandboxStore((store) => store.setActiveFile);
  const setEditFileName = useSandboxStore((store) => store.setEditFileName);

  const onClickEditFileName = (path: string) => {
    setEditFileName(path);
  };

  const onClickRemoveFile = (path: string) => {
    removeFile(path);
  };

  useEffect(() => {
    // TODO: Convert the edit file name item to use [contenteditable] and save result on pressing enter
    // TODO: Auto focus the matching field
  }, [editFilePathName]);

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
            </FileButton>

            <Dropdown.Root>
              <Dropdown.Trigger asChild>
                <FileDropdownButton type="button">
                  <DotsThreeVertical weight="bold" />
                </FileDropdownButton>
              </Dropdown.Trigger>

              <Dropdown.Content sideOffset={2}>
                <Dropdown.Item onClick={() => onClickEditFileName(path)}>
                  <PencilSimple />
                  Rename File
                </Dropdown.Item>

                <Dropdown.Item onClick={() => onClickRemoveFile(path)}>
                  <Trash color="var(--color-danger)" />
                  Delete File
                </Dropdown.Item>
              </Dropdown.Content>
            </Dropdown.Root>
          </FileListItem>
        ))}
      </FileList>
    </Wrapper>
  );
}
