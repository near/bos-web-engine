import { QueryParams } from '@bos-web-engine/common';
import { useEffect, useRef, useState } from 'react';

import { Layout } from './Layout';
import s from './Sandbox.module.css';
import { usePublishedFilesSync } from '../hooks/usePublishedFilesSync';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { useSourceAccountReplace } from '../hooks/useSourceAccountReplace';

type Props = {
  height: string;
  queryParams?: QueryParams;
};

export function Sandbox({ height, queryParams }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainerElement = useSandboxStore(
    (store) => store.setContainerElement
  );
  const setQueryParams = useSandboxStore((store) => store.setQueryParams);
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

  useEffect(() => {
    setQueryParams(queryParams);
  }, [setQueryParams, queryParams]);

  if (!shouldRender) return null;

  return (
    <div className={s.wrapper} style={{ height }}>
      <div ref={containerRef}>
        <Layout />
      </div>
    </div>
  );
}
