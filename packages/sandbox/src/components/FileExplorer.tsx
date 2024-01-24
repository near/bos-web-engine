import { Dropdown } from '@bos-web-engine/ui';
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

import s from './FileExplorer.module.css';
import {
  NEW_COMPONENT_TEMPLATE,
  VALID_FILE_EXTENSION_REGEX,
} from '../constants';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { returnUniqueFilePath } from '../utils';

export function FileExplorer() {
  const containerElement = useSandboxStore((store) => store.containerElement);
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

      const otherFiles = {
        ...files,
      };
      delete otherFiles[editingFileNamePath];

      newPath = returnUniqueFilePath(
        otherFiles,
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
    <div className={s.wrapper} ref={wrapperRef}>
      <ul className={s.fileList}>
        {Object.keys(files).map((path) => (
          <li
            className={s.fileListItem}
            key={path}
            data-active={activeFilePath === path}
          >
            <button
              className={s.fileButton}
              type="button"
              title={path}
              onClick={() => setActiveFile(path)}
              onDoubleClick={() => {
                editFileName(path);
              }}
            >
              <File />

              {editingFileNamePath === path ? (
                <span
                  className={s.fileName}
                  contentEditable="plaintext-only"
                  data-file-name-input={path}
                  spellCheck="false"
                  onBlur={onFileNameInputBlur}
                  onKeyDown={onFileNameInputKeyDown}
                />
              ) : (
                <span className={s.fileName}>{path}</span>
              )}
            </button>

            <Dropdown.Root>
              <Dropdown.Trigger asChild>
                <button
                  className={s.fileDropdownButton}
                  type="button"
                  tabIndex={-1}
                >
                  <DotsThreeVertical weight="bold" />
                </button>
              </Dropdown.Trigger>

              <Dropdown.Portal container={containerElement}>
                <Dropdown.Content sideOffset={2}>
                  <Dropdown.Item onSelect={() => editFileName(path)}>
                    <PencilSimple />
                    Rename File
                  </Dropdown.Item>

                  <Dropdown.Item onSelect={() => removeFile(path)}>
                    <Trash color="var(--color-danger)" />
                    Delete File
                  </Dropdown.Item>
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          </li>
        ))}
      </ul>
    </div>
  );
}
