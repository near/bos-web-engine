import { Theme } from '@bos-web-engine/ui';
import type { WalletSelector } from '@near-wallet-selector/core';
import { useEffect, useRef } from 'react';

import { Layout } from './Layout';
import s from './Sandbox.module.css';
import { useSandboxStore } from '../hooks/useSandboxStore';

type Props = {
  walletSelector: WalletSelector | null;
};

export function Sandbox({ walletSelector }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainerElement = useSandboxStore(
    (store) => store.setContainerElement
  );

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

  return (
    <Theme includeDefaultStyles className={s.wrapper}>
      <div ref={containerRef}>
        <Layout />
      </div>
    </Theme>
  );
}
