import { SandpackProvider } from '@codesandbox/sandpack-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { CustomSandpackLayout } from './CustomSandpackLayout';
import { DEFAULT_SANDPACK_FILES } from '../constants';

const Wrapper = styled.div`
  height: 100%;
  width: 100%;

  .sp-wrapper {
    width: 100%;
  }

  .sp-layout {
    border-radius: 0;
  }

  .sp-wrapper,
  .sp-layout,
  .sp-stack,
  .sp-code-editor,
  .sp-file-explorer {
    height: 100%;
  }
`;

export function Sandbox() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setShouldRender(true);
  }, []);

  if (!shouldRender) return null;

  return (
    <Wrapper>
      <SandpackProvider theme="auto" files={DEFAULT_SANDPACK_FILES}>
        <CustomSandpackLayout />
      </SandpackProvider>
    </Wrapper>
  );
}
