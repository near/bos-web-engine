import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import styled from 'styled-components';

import { useComponentSourcesStore } from '../stores/component-sources';

const SidebarButton = styled.button<{ $selected?: boolean }>`
  background-color: ${(props) =>
    props.$selected ? 'rebeccapurple' : 'transparent'};
  padding: 0.5rem;
  border: 1px solid transparent;
  border-bottom: 1px solid black;
  color: white;
  text-align: left;
  overflow-wrap: break-word;
  &:hover {
    border: 1px solid white;
  }
`;

const CloseButton = styled.button`
  background-color: #343028;
  position: absolute;
  top: 0;
  right: 1.5rem;
  padding: 0.5rem;
  border: 1px solid transparent;
  border-bottom: 1px solid black;
  color: white;
  text-align: left;
  &:hover {
    border: 1px solid white;
  }
`;

const OpenButton = styled.button`
  background-color: #343028;
  position: fixed;
  bottom: 0;
  right: 1.5rem;
  padding: 0.5rem;
  border: 1px solid transparent;
  border-bottom: 1px solid black;
  color: white;
  text-align: left;
  &:hover {
    border: 1px solid white;
  }
  border-radius: 0.5rem 0.5rem 0 0;
`;

const ComponentList = styled.div`
  display: flex;
  flex: none;
  flex-direction: column;
  min-width: 20rem;
  max-width: 30rem;
  background-color: #343028;
  overflow-y: auto;
`;

const Panel = styled.div<{ $show?: boolean }>`
  display: ${(props) => (props.$show ? 'flex' : 'none')};
  flex-direction: row;
  width: 100vw;
  height: 40vh;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 2;
  border-top: 1px solid black;
`;

export function Inspector() {
  // at some point this state may be hoisted, but for now this component handles
  // its own visibility
  const [show, setShow] = useState(false);

  const componentSources = useComponentSourcesStore((state) => state.sources);

  // path of selected component, will need to be modified once we support version locking
  // since it will be possible to have multiple versions of the same component
  const [selectedComponent, setSelectedComponent] = useState<string>();

  if (!show) {
    return (
      <OpenButton
        onClick={() => {
          setShow(true);
        }}
      >
        Code
      </OpenButton>
    );
  }

  return (
    <Panel $show={show}>
      <ComponentList>
        {Object.keys(componentSources)
          .sort()
          .map((path) => {
            return (
              <SidebarButton
                key={path}
                onClick={() => {
                  setSelectedComponent(path);
                }}
                $selected={selectedComponent === path}
              >
                {path}
              </SidebarButton>
            );
          })}
      </ComponentList>
      <div
        style={{
          flex: 1,
          height: '100%',
        }}
      >
        <CloseButton
          onClick={() => {
            setShow(false);
          }}
        >
          Close
        </CloseButton>
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
        >
          {selectedComponent
            ? componentSources[selectedComponent]
            : '// select a component from the list to inspect'}
        </SyntaxHighlighter>
      </div>
    </Panel>
  );
}
