import { SandboxFile, SandboxFiles } from './hooks/useSandboxStore';
import { MonacoExternalLibrary } from './types';

export const FILE_EXTENSIONS = ['tsx', 'module.css'] as const;
export type FileExtension = (typeof FILE_EXTENSIONS)[number];

export const DEFAULT_SANDBOX_ACCOUNT_ID = 'bwe-web.near';
export const PREACT_VERSION = '10.17.1';
export const FILE_EXTENSION_REGEX = new RegExp(
  `\\.(${FILE_EXTENSIONS.join('|')})$`
);
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
      declare module '*.module.css' {
        const classes: { [key: string]: string };
        export default classes;
      }

      type BWEComponent<TProps = {}> = (props: {
        id?: string;
        props?: TProps;
        trust?: { mode: string };
      }) => JSX.Element;

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
    css: `
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: #f1f0ef;
  height: calc(100vh - var(--gateway-header-height))
}    

.examples {
  display: flex;
  flex-direction: row;
  column-gap: 1rem;
  flex-wrap: wrap;
  row-gap: 1.5rem;
}
  
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 2rem;
  max-width: 500px;
  background: var(--color-surface-1);
  border-radius: 1rem;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.05), 0 5px 5px rgba(0, 0, 0, 0.05), 0 0 30px rgba(0, 0, 0, 0.05);
  min-width: 25rem;
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
}
  `,
    source: `
/*
  Welcome to the BOS Web Engine Sandbox!

  This environment has TypeScript support. All changes in this IDE 
  are automatically persisted in local storage. Feel free to add, 
  remove, and rename files.
  
  The following code example demonstrates multi file component editing 
  capabilities. Try opening up Message.tsx from the file explorer, 
  make a visible code change, and then come back to HelloWorld.tsx
  to see your changes reflected in the imported component.
*/

import { useState } from 'react';
import Message from './Message';
import s from './styles.module.css';

// expect error underlines on npm import lines, the editor is not able to resolve them
import reverse from 'lodash/reverse';
import { BookOpenText } from '@phosphor-icons/react/dist/icons/BookOpenText';
import { Plus } from '@phosphor-icons/react/dist/icons/Plus';

function HelloWorld() {
  const [count, setCount] = useState(0);

  return (
    <div className={s.wrapper}>
      <h1>Welcome to the BOS Web Engine Sandbox!</h1>
      <div style={{ display: 'flex', columnGap: '0.5rem' }}>
        <p>If you are new to BWE development, check out the docs in the sidebar</p>
        <BookOpenText className={s.icon} />
      </div>
      <p>You can hit the <Plus style={{display: 'inline'}} /> button in the sidebar to create a new component with recommended boilerplate</p>

      <h2>Here are a few examples</h2>
      <div className={s.examples}>
        <div className={s.card}>
          <h3>Embedding another BWE component</h3>
          <Message props={{ message: 'Hello world!' }} />
        </div>
        <div className={s.card}>
          <h3>React <code>useState</code></h3>
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            Increase Count: {count}
          </button>
        </div>
        <div className={s.card}>
          <h3>Using an imported library</h3>
          <p>Lodash <code>_.reverse([1, 2, 3])</code></p>
          {JSON.stringify(reverse([1, 2, 3]))}
        </div>
      </div>
    </div>
  );
}

export default HelloWorld as BWEComponent;
`,
  },
  'Message.tsx': {
    css: `
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--green-4);
  color: var(green-1);
  border-radius: 0.5rem;

  --green-1: #fbfefc;
  --green-4: #d6f1df;
  --green-10: #2b9a66;
}

.title {
  color: var(--green-10);
}

.message {
  color: var(--green-10);
}
`,
    source: `
import s from './styles.module.css';

type Props = {
  message?: string;
};

function Message({ message = 'Default message...' }: Props) {
  return (
    <div className={s.wrapper}>
      <h2 className={s.title}>Message:</h2>
      <p className={s.message}>{message}</p>
    </div>
  );
}

export default Message as BWEComponent<Props>;
`,
  },
};

export const NEW_COMPONENT_TEMPLATE: SandboxFile = {
  css: `.wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
`,
  source: `import s from './styles.module.css';

type Props = {
  message?: string;
};

function MyComponent({ message = "Hello!" }: Props) {
  return (
    <div className={s.wrapper}>
      <p>{message}</p>
    </div>
  );
}

export default MyComponent as BWEComponent<Props>;
`,
};
