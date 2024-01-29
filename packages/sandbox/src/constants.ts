import { SandboxFiles } from './hooks/useSandboxStore';
import { MonacoExternalLibrary } from './types';

export const ACCOUNT_ID = 'bwe-web.near';
export const PREACT_VERSION = '10.17.1';
export const VALID_FILE_EXTENSION_REGEX = /\.(tsx)$/;
export const PREVIEW_UPDATE_DEBOUNCE_DELAY = 750;

export const MONACO_EXTERNAL_LIBRARIES: MonacoExternalLibrary[] = [
  {
    // Include the DOM types manually due to TS Config `lib: ["dom"]` not working in Monaco:
    resolutionPath: 'file:///dom.d.ts',
    url: 'https://www.unpkg.com/typescript@5.3.3/lib/lib.dom.d.ts',
  },
  {
    // Include the ES types manually due to TS Config `lib: ["ESNext"]` not working in Monaco:
    resolutionPath: 'file:///es.d.ts',
    url: 'https://www.unpkg.com/typescript@5.3.3/lib/lib.esnext.d.ts',
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
    source: `import { JSX } from 'react';
    
    declare global {
      function Component(props: {
        src: string;
        props?: Record<any, any>;
        trust?: { mode: string };
        id?: string;
      }): JSX.Element;
    }`,
  },
];

export const DEFAULT_FILES: SandboxFiles = {
  'HelloWorld.tsx': {
    source: `/*
  Welcome to the BOS Web Engine Sandbox!

  This environment has TypeScript support. All changes in this IDE 
  are automatically persisted in local storage. Feel free to add, 
  remove, and rename files.
  
  For now, you should reference "${ACCOUNT_ID}" in the src prop 
  when creating a new  component and referencing it via <Component />. 
  For example: "${ACCOUNT_ID}/MyNewComponent.tsx". We will support 
  signing in and referencing your own account soon.
  
  The following code example demonstrates multi file component editing 
  capabilities. Try opening up Message.tsx from the file explorer, 
  make a visible code change, and then come back to HelloWorld.tsx
  to see your changes reflected in the <Component /> reference.
*/
import { useState } from 'react';

export function BWEComponent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Welcome!</h1>

      <Component
        src="${ACCOUNT_ID}/Message"
        props={{ message: 'Hello world!' }}
        /*
          The props object for <Component /> doesn't support type 
          safety at the moment due to the dynamic complexities 
          involved. Implementing type safety for props is a long 
          term goal.
        */
      />

      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Increase Count: {count}
      </button>
    </div>
  );
}
`,
  },
  'Message.tsx': {
    source: `interface Props {
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

export const NEW_COMPONENT_TEMPLATE = {
  source: `interface Props {
  message?: string;
}

export function BWEComponent({ message = "Hello"}: Props) {
  return (
    <div>
      <p>{message}</p>
    </div>
  );
}`,
};
