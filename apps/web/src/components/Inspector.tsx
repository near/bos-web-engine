import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import s from './Inspector.module.css';

import { useComponentSourcesStore } from '@/stores/component-sources';
import { useFlagsStore } from '@/stores/flags';

export function Inspector() {
  const preRef = useRef<HTMLPreElement | null>(null);

  // at some point this state may be hoisted, but for now this component handles
  // its own visibility
  const [show, setShow] = useState(false);

  // accept query param to expand the inspector by default
  const router = useRouter();
  const { query } = router;
  useEffect(() => {
    if (router.isReady && query.showCode === 'true') {
      setShow(true);
    }
  }, [router, router.isReady, query.showCode]);

  const componentSources = useComponentSourcesStore((state) => state.sources);
  const sortedSources = useMemo(
    () => Object.keys(componentSources).sort(),
    [componentSources]
  );

  // path of selected component, will need to be modified once we support version locking
  // since it will be possible to have multiple versions of the same component
  const [selectedComponent, setSelectedComponent] = useState<string>();

  const PreTagWithRef = (
    preProps: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLPreElement>,
      HTMLPreElement
    >
  ) => <pre {...preProps} ref={preRef} />;

  useEffect(() => {
    if (!selectedComponent && sortedSources.length > 0) {
      setSelectedComponent(sortedSources[0]);
    }
  }, [sortedSources, selectedComponent]);

  const flags = useFlagsStore((state) => state.flags);
  const updateFlags = useFlagsStore((state) => state.updateFlags);

  const [inputBosLoaderUrl, setInputBosLoaderUrl] = useState(
    flags?.bosLoaderUrl || ''
  );

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
      <div className={s.flagSet}>
        <form
          className={s.flag}
          onSubmit={(e) => {
            e.preventDefault();
            updateFlags({ bosLoaderUrl: inputBosLoaderUrl });
          }}
        >
          <label htmlFor="bos loader url">bos-loader URL</label>
          <div className={s.clearable}>
            <input
              type="url"
              id="bos loader url"
              value={inputBosLoaderUrl}
              onChange={(e) => setInputBosLoaderUrl(e.target.value)}
            />
            <button type="button" onClick={() => setInputBosLoaderUrl('')}>
              <span aria-label="clear" role="img">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 256 256"
                >
                  <path d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
                </svg>
              </span>
            </button>
          </div>
          <button>Save URL</button>
        </form>
        <div className={s.flag}>
          <label htmlFor="boundaries">Show container boundaries</label>
          <input
            type="checkbox"
            id="boundaries"
            checked={flags?.showContainerBoundaries}
            onChange={(e) => {
              updateFlags({ showContainerBoundaries: e.target.checked });
            }}
          />
        </div>
      </div>
      <div className={s.sourceViewer}>
        <div className={s.componentList}>
          {sortedSources.map((path) => {
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
    </div>
  );
}
