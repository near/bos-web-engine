import type { WebEngineLocalComponents } from '@bos-web-engine/application';
import {
  ComponentTree,
  useWebEngineSandbox,
} from '@bos-web-engine/application';
import { Dropdown } from '@bos-web-engine/ui';
import { CaretDown, Eye } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import s from './Preview.module.css';
import {
  ACCOUNT_ID,
  PREACT_VERSION,
  PREVIEW_UPDATE_DEBOUNCE_DELAY,
} from '../constants';
import { useDebouncedValue } from '../hooks/useDebounced';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { convertFilePathToComponentName } from '../utils';

export function Preview() {
  const containerElement = useSandboxStore((store) => store.containerElement);
  const activeFilePath = useSandboxStore((store) => store.activeFilePath);
  const pinnedPreviewFilePath = useSandboxStore(
    (store) => store.pinnedPreviewFilePath
  );
  const setPinnedPreviewFile = useSandboxStore(
    (store) => store.setPinnedPreviewFile
  );
  const files = useSandboxStore((store) => store.files);
  const debouncedFiles = useDebouncedValue(
    files,
    PREVIEW_UPDATE_DEBOUNCE_DELAY
  );
  const [localComponents, setLocalComponents] =
    useState<WebEngineLocalComponents>();
  const [rootComponentPath, setRootComponentPath] = useState('');
  const previewFilePath = pinnedPreviewFilePath ?? activeFilePath;

  const { components, nonce } = useWebEngineSandbox({
    config: {
      preactVersion: PREACT_VERSION,
    },
    localComponents,
    rootComponentPath,
  });

  useEffect(() => {
    if (!previewFilePath) return;
    const componentName = convertFilePathToComponentName(previewFilePath);
    const componentPath = `${ACCOUNT_ID}/${componentName}`;
    setRootComponentPath(componentPath);
  }, [previewFilePath]);

  useEffect(() => {
    const editorComponents: WebEngineLocalComponents = {};

    Object.entries(debouncedFiles).forEach(([filePath, file]) => {
      if (!file) return;

      const fileType = filePath.split('.').pop() ?? '';

      if (!['jsx', 'tsx'].includes(fileType)) return;

      const componentName = convertFilePathToComponentName(filePath);
      const path = `${ACCOUNT_ID}/${componentName}`;

      const [component, css] = file.source.split('/*CSS*/');
      editorComponents[path] = {
        component,
        css,
      };
    });

    setLocalComponents(editorComponents);
  }, [debouncedFiles]);

  return (
    <div className={s.wrapper}>
      <div className={s.header}>
        <Dropdown.Root>
          <Dropdown.Trigger asChild>
            <button className={s.pinnedComponentSelector} type="button">
              <Eye weight="fill" />
              <span>{pinnedPreviewFilePath ?? 'Current Editor Component'}</span>
              <CaretDown weight="bold" style={{ opacity: 0.65 }} />
            </button>
          </Dropdown.Trigger>

          <Dropdown.Portal container={containerElement}>
            <Dropdown.Content sideOffset={4}>
              <Dropdown.Label>Preview:</Dropdown.Label>

              <Dropdown.RadioGroup
                value={pinnedPreviewFilePath || ''}
                onValueChange={(value) =>
                  setPinnedPreviewFile(value || undefined)
                }
              >
                <Dropdown.RadioItem value="">
                  <Dropdown.CheckedIndicator />
                  Current Editor Component
                </Dropdown.RadioItem>

                <hr />

                {Object.keys(files).map((path) => (
                  <Dropdown.RadioItem key={path} value={path}>
                    <Dropdown.CheckedIndicator />
                    {path}
                  </Dropdown.RadioItem>
                ))}
              </Dropdown.RadioGroup>
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
      </div>

      <div className={s.scroll}>
        <ComponentTree
          key={nonce}
          components={components}
          rootComponentPath={rootComponentPath}
        />
      </div>
    </div>
  );
}
