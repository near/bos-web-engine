import type { JSX } from 'react';

declare global {
  interface BWEComponentConfig {
    id?: string;
    trust?: { mode: string };
  }

  interface BWEComponentProps {
    bwe?: BWEComponentConfig;
  }

  type BWEComponent<TProps = {}> = (props: TProps & BWEComponentProps) => JSX.Element;

  function Component(props: { src: string } & Record<any, any> & BWEComponentProps): JSX.Element
}
