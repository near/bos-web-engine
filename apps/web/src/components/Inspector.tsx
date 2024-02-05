import { useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import s from './Inspector.module.css';
import { useComponentSourcesStore } from '../stores/component-sources';

export function Inspector() {
  const preRef = useRef<HTMLPreElement | null>(null);

  // at some point this state may be hoisted, but for now this component handles
  // its own visibility
  const [show, setShow] = useState(false);

  const componentSources = useComponentSourcesStore((state) => state.sources);

  // path of selected component, will need to be modified once we support version locking
  // since it will be possible to have multiple versions of the same component
  const [selectedComponent, setSelectedComponent] = useState<string>();

  const PreTagWithRef = (
    preProps: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLPreElement>,
      HTMLPreElement
    >
  ) => <pre {...preProps} ref={preRef} />;

  if (!show) {
    return (
      <button
        type="button"
        className={s.openButton}
        onClick={() => {
          setShow(true);
        }}
      >
        Code
      </button>
    );
  }

  return (
    <div className={s.panel}>
      <div className={s.componentList}>
        {Object.keys(componentSources)
          .sort()
          .map((path) => {
            return (
              <button
                type="button"
                className={s.button}
                key={path}
                onClick={() => {
                  setSelectedComponent(path);
                }}
                data-selected={selectedComponent === path}
              >
                {path}
              </button>
            );
          })}
      </div>

      <div
        style={{
          flex: 1,
          height: '100%',
        }}
      >
        <button
          className={s.closeButton}
          type="button"
          onClick={() => {
            setShow(false);
          }}
        >
          Close
        </button>

        <SyntaxHighlighter
          language="jsx"
          style={oneDark}
          wrapLongLines={true}
          customStyle={{
            height: '100%',
            margin: 0,
            borderRadius: 0,
          }}
          showLineNumbers={true}
          PreTag={PreTagWithRef}
        >
          {selectedComponent
            ? componentSources[selectedComponent]
            : '// select a component from the list to inspect'}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
