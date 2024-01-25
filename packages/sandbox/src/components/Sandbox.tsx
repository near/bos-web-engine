import { Theme } from '@bos-web-engine/ui';
import { useWallet } from '@bos-web-engine/wallet-selector-control';
import { useEffect, useRef, useState } from 'react';

import { Layout } from './Layout';
import s from './Sandbox.module.css';
import { useSandboxStore } from '../hooks/useSandboxStore';

export function Sandbox() {
  const { walletSelector } = useWallet();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainerElement = useSandboxStore(
    (store) => store.setContainerElement
  );
  const [shouldRender, setShouldRender] = useState(false);

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
    console.log(
      'TODO: Use wallet selector instance to publish component changes',
      walletSelector
    );
  }, [walletSelector]);

  if (!shouldRender) return null;

  return (
    <Theme includeDefaultStyles className={s.wrapper}>
      <div ref={containerRef}>
        <Layout />
      </div>
    </Theme>
  );
}
