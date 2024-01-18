import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Layout } from './Layout';
import { useSandboxStore } from '../hooks/useSandboxStore';

const Wrapper = styled.div`
  --color-border-1: #4a4a4a;
  --color-text-1: #fff;
  --color-text-2: #c6c6c6;
  --color-surface-1: #000;
  --color-surface-2: #131313;
  --color-surface-3: #272727;
  --color-surface-4: #333333;
  --color-surface-primary: #6e63d4;
  --color-affirm: #7af5b8;
  --color-danger: #d76464;
  --font-primary: sans-serif;

  width: 100%;
  height: 100%;
  font-family: var(--font-primary);
  color: var(--color-text-1);
  background: var(--color-surface-1);
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
      setContainerElement(containerRef.current);
    }
  });

  if (!shouldRender) return null;

  return (
    <Wrapper ref={containerRef}>
      <Layout />
    </Wrapper>
  );
}
