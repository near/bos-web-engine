import {
  useState as useReactState,
  useEffect as useReactEffect,
  FunctionComponent,
} from 'react';

declare global {
  const useState: typeof useReactState;
  const useEffect: typeof useReactEffect;
  const props: any;
  const Component: FunctionComponent<{
    src: string;
    props?: any;
    trust?: { mode: string };
    id?: string;
  }>;
  const Widget: typeof Component;
}
