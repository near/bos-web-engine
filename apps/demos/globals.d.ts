import { useState as useReactState, useEffect as useReactEffect } from 'react';

declare global {
  const useState: typeof useReactState;
  const useEffect: typeof useReactEffect;
  function Component(props: {
    src: string;
    props?: Record<any, any>;
    trust?: { mode: string };
    id?: string;
  }): JSX.Element;
}
