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
import {
  NEW_COMPONENT_TEMPLATE,
  VALID_FILE_EXTENSION_REGEX,
} from '../constants';
import { useModifiedFiles } from '../hooks/useModifiedFiles';
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
              <li
                className={s.fileListItem}
                key={path}
                data-active={activeFilePath === path}
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
              </li>
            ))}
        </ul>

        <div className={s.footer}>
          {modifiedFilePaths.length > 0 ? (
            <PublishButton selectedFilePaths={selectedFilePaths} />
          ) : (
            <>
              <CheckCircle fill="var(--color-affirm)" weight="bold" />
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
            data-active={activeFilePath === path}
            data-modified={modifiedFilePaths.includes(path)}
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
              <File className={s.fileIcon} />

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
