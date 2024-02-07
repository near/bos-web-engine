/*
  TODO: This component should probably be refactored and cleaned up once we 
  start implementing proper folder structure UX.
*/

import { Checkbox, Dropdown, Text } from '@bos-web-engine/ui';
import {
  File,
  DotsThreeVertical,
  Trash,
  PencilSimple,
  CheckCircle,
} from '@phosphor-icons/react';
import {
  ChangeEventHandler,
  FocusEventHandler,
  KeyboardEventHandler,
  useEffect,
  useRef,
  useState,
} from 'react';

import s from './FileExplorer.module.css';
import { PublishButton } from './PublishButton';
import { useModifiedFiles } from '../hooks/useModifiedFiles';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { returnUniqueFilePath, normalizeFilePathAndExtension } from '../utils';

export function FileExplorer() {
  const containerElement = useSandboxStore((store) => store.containerElement);
  const activeFilePath = useSandboxStore((store) => store.activeFilePath);
  const activeFileChildSourceType = useSandboxStore(
    (store) => store.activeFileChildSourceType
  );
  const editingFileNamePath = useSandboxStore(
    (store) => store.editingFileNamePath
  );
  const files = useSandboxStore((store) => store.files);
  const removeFileFromStore = useSandboxStore((store) => store.removeFile);
  const setActiveFile = useSandboxStore((store) => store.setActiveFile);
  const setEditingFileName = useSandboxStore(
    (store) => store.setEditingFileName
  );
  const addNewFile = useSandboxStore((store) => store.addNewFile);
  const updateFilePath = useSandboxStore((store) => store.updateFilePath);
  const mode = useSandboxStore((store) => store.mode);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { modifiedFilePaths } = useModifiedFiles();
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);

  const editFileName = (path: string) => {
    setEditingFileName(path);
  };

  const removeFile = (path: string) => {
    const isLastFile = Object.keys(files).length < 2;

    removeFileFromStore(path);

    if (isLastFile) {
      addNewFile();
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

  const onFileCheckboxChange: ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    if (event.target.checked) {
      setSelectedFilePaths((paths) => [...paths, event.target.value]);
    } else {
      setSelectedFilePaths((paths) =>
        paths.filter((path) => path !== event.target.value)
      );
    }
  };

  const onFileNameInputBlur: FocusEventHandler<HTMLSpanElement> = (event) => {
    if (!editingFileNamePath) return;

    let newFilePath = event.target.innerText.trim();
    const isEditingFileNameForActiveFile =
      editingFileNamePath === activeFilePath;

    if (newFilePath) {
      const otherFiles = {
        ...files,
      };
      delete otherFiles[editingFileNamePath];

      const { fileExtension, filePathWithoutExtension } =
        normalizeFilePathAndExtension(newFilePath);

      newFilePath = returnUniqueFilePath(
        otherFiles,
        filePathWithoutExtension,
        fileExtension
      );

      updateFilePath(editingFileNamePath, newFilePath);

      if (isEditingFileNameForActiveFile) {
        setActiveFile(newFilePath);
      }
    }

    setEditingFileName(undefined);
  };

  useEffect(() => {
    if (mode === 'PUBLISH') {
      setSelectedFilePaths(modifiedFilePaths);
    }
  }, [activeFilePath, mode, modifiedFilePaths, setActiveFile]);

  useEffect(() => {
    if (
      mode === 'PUBLISH' &&
      (!activeFilePath || !modifiedFilePaths.includes(activeFilePath))
    ) {
      setActiveFile(modifiedFilePaths[0]);
    } else if (mode === 'EDIT' && !activeFilePath) {
      setActiveFile(Object.keys(files)[0]);
    }
  }, [activeFilePath, files, mode, modifiedFilePaths, setActiveFile]);

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

  if (mode === 'PUBLISH') {
    return (
      <div className={s.wrapper} ref={wrapperRef}>
        <ul className={s.fileList}>
          {Object.keys(files)
            .filter((path) => modifiedFilePaths.includes(path))
            .map((path) => (
              <li className={s.fileListItem} key={path}>
                <div
                  className={s.fileRow}
                  data-active={
                    activeFilePath === path && !activeFileChildSourceType
                  }
                >
                  <Checkbox
                    aria-label={`Include ${path}?`}
                    checked={selectedFilePaths.includes(path)}
                    name={`file-included-${path}`}
                    value={path}
                    onChange={onFileCheckboxChange}
                  />

                  <button
                    className={s.fileButton}
                    type="button"
                    title={path}
                    onClick={() => setActiveFile(path)}
                  >
                    <span className={s.fileName}>{path}</span>
                  </button>
                </div>

                <div
                  className={s.fileRow}
                  data-child="true"
                  data-active={
                    activeFilePath === path &&
                    activeFileChildSourceType === 'CSS'
                  }
                >
                  <button
                    className={s.fileButton}
                    type="button"
                    onClick={() => setActiveFile(path, 'CSS')}
                  >
                    <span className={s.fileName}>styles.css</span>
                  </button>
                </div>
              </li>
            ))}
        </ul>

        <div className={s.footer}>
          {modifiedFilePaths.length > 0 ? (
            <PublishButton selectedFilePaths={selectedFilePaths} />
          ) : (
            <>
              <CheckCircle
                fill="var(--color-affirm)"
                weight="duotone"
                style={{ width: '2rem', height: '2rem' }}
              />
              <Text
                size="s"
                color="affirm"
                weight="bold"
                style={{ textAlign: 'center' }}
              >
                All changes published!
              </Text>
              <Text size="xs" style={{ textAlign: 'center' }}>
                Your local components match the source code on chain.
              </Text>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={s.wrapper} ref={wrapperRef}>
      <ul className={s.fileList}>
        {Object.keys(files).map((path) => (
          <li
            className={s.fileListItem}
            key={path}
            data-modified={modifiedFilePaths.includes(path)}
          >
            <div
              className={s.fileRow}
              data-active={
                activeFilePath === path && !activeFileChildSourceType
              }
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
                <File className={s.fileIcon} weight="bold" />

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
                      <PencilSimple weight="bold" />
                      Rename
                    </Dropdown.Item>

                    <Dropdown.Item onSelect={() => removeFile(path)}>
                      <Trash fill="var(--color-danger)" weight="bold" />
                      Delete
                    </Dropdown.Item>
                  </Dropdown.Content>
                </Dropdown.Portal>
              </Dropdown.Root>
            </div>

            <div
              className={s.fileRow}
              data-child="true"
              data-active={
                activeFilePath === path && activeFileChildSourceType === 'CSS'
              }
            >
              <button
                className={s.fileButton}
                type="button"
                onClick={() => setActiveFile(path, 'CSS')}
              >
                <span className={s.fileName}>styles.css</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
