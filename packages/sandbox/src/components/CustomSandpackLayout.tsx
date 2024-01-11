import type { WebEngineLocalComponents } from '@bos-web-engine/application';
import { ComponentTree, useWebEngine } from '@bos-web-engine/application';
import {
  SandpackFileExplorer,
  SandpackLayout,
  useSandpack,
} from '@codesandbox/sandpack-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { MonacoEditor } from './MonacoEditor';
import { SidebarActions } from './SidebarActions';
import { ACCOUNT_ID, PREACT_VERSION } from '../constants';
import { PanelType } from '../types';
import { convertSandpackFilePathToComponentName } from '../utils';

const Wrapper = styled.div`
  --file-explorer-width: 12rem;
  --grid-template-columns: min-content var(--file-explorer-width) 1fr 1fr;
  width: 100%;
  height: 100%;

  .sp-layout {
    width: 100%;
    display: grid;
    grid-template-columns: var(--grid-template-columns);
    border-radius: 0;

    > * {
      overflow: hidden;
    }
  }

  .sp-layout,
  .sp-stack,
  .sp-code-editor,
  .sp-file-explorer {
    height: 100%;
    min-width: unset;
  }

  &[data-expanded-panel='EDITOR'] {
    --grid-template-columns: min-content var(--file-explorer-width) 1fr 0px;
  }

  &[data-expanded-panel='PREVIEW'] {
    --grid-template-columns: min-content 0px 0px 1fr;
  }
`;

const Editor = styled.div``;

const Preview = styled.div`
  color: #000;
  background: #fff;
`;

export function CustomSandpackLayout() {
  const { sandpack } = useSandpack();
  const { activeFile, files, visibleFiles } = sandpack;
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
    const componentName = convertSandpackFilePathToComponentName(activeFile);
    const componentPath = `${ACCOUNT_ID}/${componentName}`;
    setRootComponentPath(componentPath);
  }, [activeFile]);

  useEffect(() => {
    const editorComponents: WebEngineLocalComponents = {};

    visibleFiles.forEach((sandpackFilePath) => {
      const fileType = sandpackFilePath.split('.').pop() ?? '';

      if (!['jsx', 'tsx'].includes(fileType)) return;

      const sandpackFile = files[sandpackFilePath];
      const componentName =
        convertSandpackFilePathToComponentName(sandpackFilePath);
      const path = `${ACCOUNT_ID}/${componentName}`;

      editorComponents[path] = {
        source: sandpackFile.code,
      };
    });

    setLocalComponents(editorComponents);
  }, [files, visibleFiles]);

  return (
    <Wrapper data-expanded-panel={expandedPanel ?? ''}>
      <SandpackLayout>
        <SidebarActions
          expandedPanel={expandedPanel}
          onSelectExpandPanel={setExpandedPanel}
        />

        <SandpackFileExplorer autoHiddenFiles />

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
      </SandpackLayout>
    </Wrapper>
  );
}
