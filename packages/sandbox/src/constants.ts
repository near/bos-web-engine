import { SandpackFiles } from '@codesandbox/sandpack-react/types';

import { MonacoExternalLibrary } from './types';

export const ACCOUNT_ID = 'bwe-demos.near';
export const PREACT_VERSION = '10.17.1';

export const MONACO_EXTERNAL_LIBRARIES: MonacoExternalLibrary[] = [
  {
    resolutionPath: 'file:///dom.d.ts',
    url: 'https://www.unpkg.com/typescript@5.3.3/lib/lib.dom.d.ts',
  },
  {
    resolutionPath: 'file:///es.d.ts',
    url: 'https://www.unpkg.com/typescript@5.3.3/lib/lib.es2021.d.ts',
  },
  {
    resolutionPath: 'file:///node_modules/@types/react/index.d.ts',
    url: 'https://unpkg.com/@types/react@18.2.47/index.d.ts',
  },
  {
    resolutionPath: 'file:///node_modules/@types/react-dom/index.d.ts',
    url: 'https://unpkg.com/@types/react-dom@18.2.18/index.d.ts',
  },
  {
    resolutionPath: 'file:///node_modules/@types/react/jsx-runtime.d.ts',
    url: 'https://unpkg.com/@types/react@18.2.47/jsx-runtime.d.ts',
  },
  {
    resolutionPath: 'file:///globals.d.ts',
    source: `import {
      useState as useReactState,
      useEffect as useReactEffect,
      ComponentType,
    } from 'react';
    
    declare global {
      const useState: typeof useReactState;
      const useEffect: typeof useReactEffect;
      function Component(props: {
        src: string;
        props?: Record<any, any>;
        trust?: { mode: string };
        id?: string;
      }): JSX.Element;
    }`,
  },
];

export const DEFAULT_SANDPACK_FILES: SandpackFiles = {
  '/HelloWorld.tsx': {
    active: true,
    code: `export function BWEComponent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Welcome!</h1>

      <Component
        src="bwe-demos.near/Message"
        props={{ message: 'Hello world!' }}
      />

      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Increase Count: {count}
      </button>
    </div>
  );
}`,
  },
  '/Message.tsx': {
    code: `interface Props {
  message: string;
}

export function BWEComponent(props: Props) {
  return (
    <div>
      <h2>BOS Says:</h2>
      <p>{props.message}</p>
    </div>
  );
}`,
  },
};
