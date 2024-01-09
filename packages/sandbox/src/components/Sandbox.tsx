import { SandpackProvider } from '@codesandbox/sandpack-react';
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
  return (
    <Wrapper>
      <SandpackProvider
        theme="auto"
        template="vanilla-ts"
        files={DEFAULT_SANDPACK_FILES}
      >
        <CustomSandpackLayout />
      </SandpackProvider>
    </Wrapper>
  );
}
