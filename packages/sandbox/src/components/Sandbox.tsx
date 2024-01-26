import { Theme } from '@bos-web-engine/ui';
import { useEffect, useRef, useState } from 'react';

import { Layout } from './Layout';
import s from './Sandbox.module.css';
import { usePublishedFilesSync } from '../hooks/usePublishedFilesSync';
import { useSandboxStore } from '../hooks/useSandboxStore';

export function Sandbox() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainerElement = useSandboxStore(
    (store) => store.setContainerElement
  );
  const [shouldRender, setShouldRender] = useState(false);
  usePublishedFilesSync();

  useEffect(() => {
    /*
      This prevents Next JS from rendering this component on the server side and
      prevents hydration errors.
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
    <Theme includeDefaultStyles className={s.wrapper}>
      <div ref={containerRef}>
        <Layout />
      </div>
    </Theme>
  );
}
