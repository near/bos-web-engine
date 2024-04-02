import {
  ComponentTree,
  useWebEngineSandbox,
} from '@bos-web-engine/application';
import type { BOSModule } from '@bos-web-engine/common';
import { Dropdown, ThemeProvider } from '@bos-web-engine/ui';
import { useWallet } from '@bos-web-engine/wallet-selector-control';
import { CaretDown, Eye } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import s from './Preview.module.css';
import {
  DEFAULT_SANDBOX_ACCOUNT_ID,
  PREVIEW_UPDATE_DEBOUNCE_DELAY,
} from '../constants';
import { useDebouncedValue } from '../hooks/useDebounced';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { convertFilePathToComponentName, filePathIsComponent } from '../utils';

type WebEngineLocalComponents = { [path: string]: BOSModule };

export function Preview() {
  const { account } = useWallet();
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
  const accountId = account?.accountId ?? DEFAULT_SANDBOX_ACCOUNT_ID;

  const { components, nonce } = useWebEngineSandbox({
    localComponents,
    rootComponentPath,
  });

  useEffect(() => {
    if (!previewFilePath) {
      setRootComponentPath('');
      return;
    }

    const componentName = convertFilePathToComponentName(previewFilePath);
    const componentPath = `${accountId}/${componentName}`;
    setRootComponentPath(componentPath);
  }, [accountId, previewFilePath]);

  useEffect(() => {
    const editorComponents: WebEngineLocalComponents = {};

    Object.entries(debouncedFiles).forEach(([filePath, file]) => {
      if (!file) return;

      const isComponent = filePathIsComponent(filePath);
      if (!isComponent) return;

      const componentName = convertFilePathToComponentName(filePath);
      const path = `${accountId}/${componentName}`;

      editorComponents[path] = {
        css: file.css,
        component: file.source,
      };
    });

    setLocalComponents(editorComponents);
  }, [accountId, debouncedFiles]);

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

      <ThemeProvider defaultTheme="light" className={s.scroll}>
        {rootComponentPath && (
          <ComponentTree
            key={nonce}
            components={components}
            currentUserAccountId={account?.accountId}
            rootComponentPath={rootComponentPath}
          />
        )}
      </ThemeProvider>
    </div>
  );
}
