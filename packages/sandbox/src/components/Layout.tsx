import type { WebEngineLocalComponents } from '@bos-web-engine/application';
import { ComponentTree, useWebEngine } from '@bos-web-engine/application';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { FileExplorer } from './FileExplorer';
import { MonacoEditor } from './MonacoEditor';
import { SidebarActions } from './SidebarActions';
import {
  ACCOUNT_ID,
  PREACT_VERSION,
  PREVIEW_UPDATE_DEBOUNCE_DELAY,
} from '../constants';
import { useDebouncedValue } from '../hooks/useDebounced';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { PanelType } from '../types';
import { convertFilePathToComponentName } from '../utils';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: min-content 14rem 1fr 1fr;
  width: 100%;
  height: 100%;

  > * {
    overflow: hidden;
  }

  &[data-expanded-panel='EDITOR'] {
    grid-template-columns: min-content 14rem 1fr 0px;
  }

  &[data-expanded-panel='PREVIEW'] {
    grid-template-columns: min-content 0px 0px 1fr;
  }
`;

const Editor = styled.div`
  display: flex;
  min-width: 0;
  height: 100%;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
`;

const Preview = styled.div`
  height: 100%;
  position: relative;
  color: #000;
  background: linear-gradient(-45deg, #6861bd, #72cbdb);
  box-sizing: border-box;
`;

const PreviewScroll = styled.div`
  position: absolute;
  inset: 1rem;
  overflow: auto;
  scroll-behavior: smooth;
  background: #fff;
`;

export function Layout() {
  const activeFilePath = useSandboxStore((store) => store.activeFilePath);
  const files = useSandboxStore((store) => store.files);
  const debouncedFiles = useDebouncedValue(
    files,
    PREVIEW_UPDATE_DEBOUNCE_DELAY
  );
  const [localComponents, setLocalComponents] =
    useState<WebEngineLocalComponents>();
  const [rootComponentPath, setRootComponentPath] = useState('');
  const [expandedPanel, setExpandedPanel] = useState<PanelType | null>(null);

  const { components, nonce } = useWebEngine({
    config: {
      preactVersion: PREACT_VERSION,
    },
    localComponents,
    rootComponentPath,
  });

  useEffect(() => {
    if (!activeFilePath) return;
    const componentName = convertFilePathToComponentName(activeFilePath);
    const componentPath = `${ACCOUNT_ID}/${componentName}`;
    setRootComponentPath(componentPath);
  }, [activeFilePath]);

  useEffect(() => {
    const editorComponents: WebEngineLocalComponents = {};

    Object.entries(debouncedFiles).forEach(([filePath, file]) => {
      if (!file) return;

      const fileType = filePath.split('.').pop() ?? '';

      if (!['jsx', 'tsx'].includes(fileType)) return;

      const componentName = convertFilePathToComponentName(filePath);
      const path = `${ACCOUNT_ID}/${componentName}`;

      editorComponents[path] = {
        source: file.source,
      };
    });

    setLocalComponents(editorComponents);
  }, [debouncedFiles]);

  return (
    <Wrapper data-expanded-panel={expandedPanel ?? ''}>
      <SidebarActions
        expandedPanel={expandedPanel}
        onSelectExpandPanel={setExpandedPanel}
      />

      <FileExplorer />

      <Editor>
        <MonacoEditor />
      </Editor>

      <Preview>
        <PreviewScroll>
          <ComponentTree
            key={nonce}
            components={components}
            rootComponentPath={rootComponentPath}
          />
        </PreviewScroll>
      </Preview>
    </Wrapper>
  );
}
