import { useEffect, useRef, useState } from 'react';

import { Layout } from './Layout';
import s from './Sandbox.module.css';
import { usePublishedFilesSync } from '../hooks/usePublishedFilesSync';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { useSourceAccountReplace } from '../hooks/useSourceAccountReplace';

type Props = {
  height: string;
};

export function Sandbox({ height }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainerElement = useSandboxStore(
    (store) => store.setContainerElement
  );
  const [shouldRender, setShouldRender] = useState(false);

  usePublishedFilesSync();
  useSourceAccountReplace();

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
    <div className={s.wrapper} style={{ height }}>
      <div ref={containerRef}>
        <Layout />
      </div>
    </div>
  );
}
