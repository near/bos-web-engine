import { Theme } from '@bos-web-engine/ui';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Layout } from './Layout';
import { useSandboxStore } from '../hooks/useSandboxStore';

const Wrapper = styled.div`
  display: flex;
  align-items: stretch;
  width: 100%;
  font-family: var(--font-primary);
  color: var(--color-text-1);
  background: var(--color-surface-1);

  > div {
    display: flex;
    align-items: stretch;
    width: 100%;
  }
`;

export function Sandbox() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainerElement = useSandboxStore(
    (store) => store.setContainerElement
  );
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

  useEffect(() => {
    if (containerRef.current) {
      console.log(containerRef.current);
      setContainerElement(containerRef.current);
    }
  });

  if (!shouldRender) return null;

  return (
    <Theme includeDefaultStyles>
      <Wrapper ref={containerRef}>
        <Layout />
      </Wrapper>
    </Theme>
  );
}
