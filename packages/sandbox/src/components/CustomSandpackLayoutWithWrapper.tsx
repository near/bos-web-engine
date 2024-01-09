import { ComponentTree, useWebEngine } from '@bos-web-engine/application';
import {
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackLayout,
  useSandpack,
} from '@codesandbox/sandpack-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { convertSandpackFilePathToComponentName } from '../utils';

const PREACT_VERSION = '10.17.1';

const Preview = styled.div`
  flex: 1 1 0;
  background: #fff;
`;

export function CustomSandpackLayoutWithWrapper() {
  const accountId = 'bwe-demos.near';
  const rootComponentPath = `${accountId}/ComponentPreview`;

  const { sandpack } = useSandpack();
  const { activeFile, files, visibleFiles } = sandpack;
  const [previewComponentPath, setPreviewComponentPath] = useState(
    `${accountId}/LandingPage`
  );

  const { components, setComponentData } = useWebEngine({
    config: {
      preactVersion: PREACT_VERSION,
    },
    rootComponentPath,
  });

  useEffect(() => {
    setComponentData(
      rootComponentPath,
      `
      export function BWEComponent() {
        return (
          <div>
            <Component
              src="${previewComponentPath}"
              trust={{ mode: 'trusted' }}
            />  
          </div>
        );
      }
    `
    );
  }, []);

  useEffect(() => {
    const componentName = convertSandpackFilePathToComponentName(activeFile);
    const componentPath = `${accountId}/${componentName}`;
    setPreviewComponentPath(componentPath);
  }, [activeFile]);

  useEffect(() => {
    visibleFiles.forEach((sandpackFilePath) => {
      const sandpackFile = files[sandpackFilePath];
      const componentName =
        convertSandpackFilePathToComponentName(sandpackFilePath);
      const componentPath = `${accountId}/${componentName}`;

      setComponentData(componentPath, sandpackFile.code);
    });
  }, [files, setComponentData, visibleFiles]);

  return (
    <SandpackLayout>
      <SandpackFileExplorer autoHiddenFiles />

      <SandpackCodeEditor showTabs closableTabs />

      <Preview>
        <ComponentTree
          components={components}
          rootComponentPath={rootComponentPath}
        />
      </Preview>
    </SandpackLayout>
  );
}
