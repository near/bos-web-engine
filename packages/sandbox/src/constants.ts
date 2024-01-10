import { SandpackFiles } from '@codesandbox/sandpack-react/types';

export const DEFAULT_SANDPACK_FILES: SandpackFiles = {
  '/HelloWorld.tsx': {
    active: true,
    code: `export function BWEComponent() {
  return (
    <div>
      <h1>Welcome!</h1>
      <Component
        src="bwe-demos.near/Message"
        props={{ message: 'Hello world!' }}
      />
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
      <p>"{props.message}"</p>
    </div>
  );
}`,
  },
};
