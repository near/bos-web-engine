import type { WebEngineLocalComponents } from '@bos-web-engine/application';
import { ComponentTree, useWebEngine } from '@bos-web-engine/application';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { FileExplorer } from './FileExplorer';
import { MonacoEditor } from './MonacoEditor';
import { SidebarActions } from './SidebarActions';
import { ACCOUNT_ID, PREACT_VERSION } from '../constants';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { PanelType } from '../types';
import { convertFilePathToComponentName } from '../utils';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: min-content min-content 1fr 1fr;
  width: 100%;
  height: 100%;

  > * {
    overflow: hidden;
  }

  &[data-expanded-panel='EDITOR'] {
    grid-template-columns: min-content min-content 1fr 0px;
  }

  &[data-expanded-panel='PREVIEW'] {
    grid-template-columns: min-content 0px 0px 1fr;
  }
`;

const Editor = styled.div`
  display: flex;
  min-width: 0;
  height: 100%;
`;

const Preview = styled.div`
  height: 100%;
  color: #000;
  background: #fff;
`;

export function Layout() {
  const activeFilePath = useSandboxStore((store) => store.activeFilePath);
  const files = useSandboxStore((store) => store.files);
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

    Object.entries(files).forEach(([filePath, file]) => {
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
  }, [files]);

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
        <ComponentTree
          key={nonce}
          components={components}
          rootComponentPath={rootComponentPath}
        />
      </Preview>
    </Wrapper>
  );
}
