import { SandpackProvider } from '@codesandbox/sandpack-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { CustomSandpackLayout } from './CustomSandpackLayout';
import { DEFAULT_SANDPACK_FILES } from '../constants';

const Wrapper = styled.div`
  width: 100%;
  height: 100%;

  .sp-wrapper {
    width: 100%;
    height: 100%;
  }
`;

export function Sandbox() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    /*
      This prevents Next JS from attempting to render this component on 
      the server. Without this logic, Next JS complains about things like
      `className` not matching what's rendered on the server. Based on 
      current assumptions, rendering this component via SSR wouldn't make 
      much sense anyways.
    */

    setShouldRender(true);
  }, []);

  if (!shouldRender) return null;

  return (
    <Wrapper>
      <SandpackProvider theme="dark" files={DEFAULT_SANDPACK_FILES}>
        <CustomSandpackLayout />
      </SandpackProvider>
    </Wrapper>
  );
}
