import type { SetComponentDataOptions } from '@bos-web-engine/application';
import { ComponentTree, useWebEngine } from '@bos-web-engine/application';
import {
  SandpackFileExplorer,
  SandpackLayout,
  useSandpack,
} from '@codesandbox/sandpack-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { MonacoEditor } from './MonacoEditor';
import { convertSandpackFilePathToComponentName } from '../utils';

const PREACT_VERSION = '10.17.1';

const Preview = styled.div`
  flex: 1 1 0;
  background: #fff;
`;

export function CustomSandpackLayout() {
  const { sandpack } = useSandpack();
  const { activeFile, files, visibleFiles } = sandpack;
  const accountId = 'bwe-demos.near';

  const [rootComponentPath, setRootComponentPath] = useState('');

  const { components, setComponentData } = useWebEngine({
    config: {
      preactVersion: PREACT_VERSION,
    },
    rootComponentPath,
  });

  useEffect(() => {
    const componentName = convertSandpackFilePathToComponentName(activeFile);
    const componentPath = `${accountId}/${componentName}`;
    setRootComponentPath(componentPath);
  }, [activeFile]);

  useEffect(() => {
    const componentsToUpdate: SetComponentDataOptions['componentsToUpdate'] =
      [];

    visibleFiles.forEach((sandpackFilePath) => {
      const fileType = sandpackFilePath.split('.').pop() ?? '';

      if (!['jsx', 'tsx'].includes(fileType)) return;

      const sandpackFile = files[sandpackFilePath];
      const componentName =
        convertSandpackFilePathToComponentName(sandpackFilePath);
      const componentPath = `${accountId}/${componentName}`;

      componentsToUpdate.push({
        componentPath,
        componentSource: sandpackFile.code,
      });
    });

    setComponentData({
      componentsToUpdate,
      resetCache: true,
    });
  }, [files, setComponentData, visibleFiles]);

  return (
    <SandpackLayout>
      <SandpackFileExplorer autoHiddenFiles />

      <MonacoEditor />

      <Preview>
        <ComponentTree
          components={components}
          rootComponentPath={rootComponentPath}
        />
      </Preview>
    </SandpackLayout>
  );
}
