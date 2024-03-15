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

function HelloWorld() {
  const [count, setCount] = useState(0);

  return (
    <div className={s.wrapper}>
      <h1>Welcome to the BOS Web Engine Sandbox!</h1>
      <div style={{ display: 'flex', columnGap: '0.5rem' }}>
        <p>
          If you are new to BWE development, check out the docs in the sidebar
          👀
        </p>
      </div>
      <p>
        You can hit the + button in the sidebar to create a new component with
        recommended boilerplate
      </p>

      <h2>Here are a few examples</h2>
      <div className={s.examples}>
        <div className={s.card}>
          <h3>Embedding another BWE component</h3>
          <Message message="Hello world!" />
        </div>
        <div className={s.card}>
          <h3>
            React <code>useState</code>
          </h3>
          <button type="button" onClick={() => setCount((value) => value + 1)}>
            Increase Count: {count}
          </button>
        </div>
        <div className={s.card}>
          <h3>Using an imported library</h3>
          <p>
            Lodash <code>_.reverse([1, 2, 3])</code>
          </p>
          {JSON.stringify(reverse([1, 2, 3]))}
        </div>
      </div>
    </div>
  );
}

export default HelloWorld as BWEComponent;
