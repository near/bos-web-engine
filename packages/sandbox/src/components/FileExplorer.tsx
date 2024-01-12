import {
  File,
  DotsThreeVertical,
  Trash,
  PencilSimple,
} from '@phosphor-icons/react';
import {
  FocusEventHandler,
  KeyboardEventHandler,
  useEffect,
  useRef,
} from 'react';
import styled from 'styled-components';

import * as Dropdown from './Dropdown';
import {
  NEW_COMPONENT_TEMPLATE,
  VALID_FILE_EXTENSION_REGEX,
} from '../constants';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { returnUniqueFilePath } from '../utils';

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
  padding: 0.25rem 0;
`;

const FileDropdownButton = styled.button`
  all: unset;
  display: none;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  flex-shrink: 0;
  color: var(--color-text-2);
  cursor: pointer;
  background: none;

  svg {
    fill: currentColor;
  }

  &:hover {
    color: var(--color-text-1);
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
  padding: 0.25rem 0.75rem;
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

  &[data-active='true'] {
    background: var(--color-surface-3);
  }

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
    box-shadow:
      inset 0 0 15px rgba(255, 255, 255, 0.2),
      inset 0 0 0 1px rgba(255, 255, 255, 0.2);
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
  const editingFileNamePath = useSandboxStore(
    (store) => store.editingFileNamePath
  );
  const files = useSandboxStore((store) => store.files);
  const removeFileFromStore = useSandboxStore((store) => store.removeFile);
  const setActiveFile = useSandboxStore((store) => store.setActiveFile);
  const setEditingFileName = useSandboxStore(
    (store) => store.setEditingFileName
  );
  const setFile = useSandboxStore((store) => store.setFile);
  const updateFilePath = useSandboxStore((store) => store.updateFilePath);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const editFileName = (path: string) => {
    setEditingFileName(path);
  };

  const removeFile = (path: string) => {
    const isLastFile = Object.keys(files).length < 2;

    removeFileFromStore(path);

    if (isLastFile) {
      const filePath = returnUniqueFilePath(files, 'Untitled', 'tsx');
      setFile(filePath, {
        source: NEW_COMPONENT_TEMPLATE.source,
      });
      setActiveFile(filePath);
      setEditingFileName(filePath);
    }
  };

  const onFileNameInputKeyDown: KeyboardEventHandler<HTMLSpanElement> = (
    event
  ) => {
    const target = event.target as HTMLSpanElement;

    if (event.key === 'Enter') {
      event.preventDefault();
      target.blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      target.innerText = editingFileNamePath ?? '';
      target.blur();
    }
  };

  const onFileNameInputBlur: FocusEventHandler<HTMLSpanElement> = (event) => {
    if (!editingFileNamePath) return;

    let newPath = event.target.innerText.trim();
    const isEditingFileNameForActiveFile =
      editingFileNamePath === activeFilePath;

    if (newPath) {
      const hasValidExtension = !!newPath.match(VALID_FILE_EXTENSION_REGEX);
      if (!hasValidExtension) {
        newPath += '.tsx';
      }

      const newPathSegments = newPath.split('.');
      const newPathExtension = newPathSegments.pop()!;
      const newPathWithoutExtension = newPathSegments.join('.');
      newPath = returnUniqueFilePath(
        files,
        newPathWithoutExtension,
        newPathExtension
      );

      updateFilePath(editingFileNamePath, newPath);

      if (isEditingFileNameForActiveFile) {
        setActiveFile(newPath);
      }
    }

    setEditingFileName(undefined);
  };

  useEffect(() => {
    setTimeout(() => {
      if (!editingFileNamePath || !wrapperRef.current) return;

      const fieldNameInput = wrapperRef.current.querySelector(
        `[data-file-name-input="${editingFileNamePath}"]`
      ) as HTMLSpanElement | null;

      if (!fieldNameInput) return;

      fieldNameInput.focus();
    }, 50);
  }, [editingFileNamePath]);

  return (
    <Wrapper ref={wrapperRef}>
      <FileList>
        {Object.keys(files).map((path) => (
          <FileListItem key={path} data-active={activeFilePath === path}>
            <FileButton
              type="button"
              title={path}
              onClick={() => setActiveFile(path)}
              onDoubleClick={() => {
                editFileName(path);
              }}
            >
              <File />

              {editingFileNamePath === path ? (
                <FileName
                  contentEditable="plaintext-only"
                  data-file-name-input={path}
                  spellCheck="false"
                  onBlur={onFileNameInputBlur}
                  onKeyDown={onFileNameInputKeyDown}
                />
              ) : (
                <FileName>{path}</FileName>
              )}
            </FileButton>

            <Dropdown.Root>
              <Dropdown.Trigger asChild>
                <FileDropdownButton type="button" tabIndex={-1}>
                  <DotsThreeVertical weight="bold" />
                </FileDropdownButton>
              </Dropdown.Trigger>

              <Dropdown.Content sideOffset={2}>
                <Dropdown.Item onClick={() => editFileName(path)}>
                  <PencilSimple />
                  Rename File
                </Dropdown.Item>

                <Dropdown.Item onClick={() => removeFile(path)}>
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
