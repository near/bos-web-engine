import type { JSX } from 'react';

declare global {
  function Component(props: {
    src: string;
    props?: Record<any, any>;
    trust?: { mode: string };
    id?: string;
  }): JSX.Element;
}
