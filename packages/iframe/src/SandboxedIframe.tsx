import type { ComponentTrust } from '@bos-web-engine/common';
import {
  buildEventHandler,
  invokeCallback,
  invokeComponentCallback,
  buildRequest,
  composeMessagingMethods,
  dispatchRenderEvent,
  initContainer,
  isMatchingProps,
  preactify,
  buildSafeProxy,
  composeSerializationMethods,
} from '@bos-web-engine/container';

function buildSandboxedComponent({
  id,
  trust,
  scriptSrc,
  componentProps,
  parentContainerId,
}: SandboxedIframeProps) {
  const componentPropsJson = componentProps
    ? JSON.stringify(componentProps)
    : '{}';

  return `
    <html>
      <body>
        <script type="importmap">
        {
          "imports": {
            "preact": "https://esm.sh/preact@10.17.1",
            "preact/": "https://esm.sh/preact@10.17.1/",
            "htm": "https://esm.sh/htm"
          }
        }
        </script>
        <script type="module">
          import * as Preact from 'preact';
          import { useEffect, useState } from 'preact/hooks';
          import htm from 'htm';

          const { createElement } = Preact;

          const html = htm.bind(createElement);

          const initContainer = ${initContainer.toString()};

          // placeholder to prevent <Widget /> references from breaking 
          function Widget() {}

          function useComponentCallback(cb, args) {
            const [value, setValue] = useState(undefined);
            useEffect(() => {
              (async () => {
                setValue(await cb(args));
              })();
            }, []);
        
            return () => value;
          }

          let props;

          // TODO fixed with preact/compat?
          const React = Preact;

          const {
            dispatchRender,
            processEvent,
            props: containerProps,
          } = initContainer({
            containerMethods: {
              buildEventHandler: ${buildEventHandler.toString()},
              buildRequest: ${buildRequest.toString()},
              buildSafeProxy: ${buildSafeProxy.toString()},
              composeMessagingMethods: ${composeMessagingMethods.toString()},
              composeSerializationMethods: ${composeSerializationMethods.toString()},
              dispatchRenderEvent: ${dispatchRenderEvent.toString()},
              invokeCallback: ${invokeCallback.toString()},
              invokeComponentCallback: ${invokeComponentCallback.toString()},
              isMatchingProps: ${isMatchingProps.toString()},
              preactify: ${preactify.toString()},
            },
            context: {
              Component: Widget,
              componentId: '${id}',
              componentPropsJson: ${componentPropsJson},
              createElement,
              parentContainerId: '${parentContainerId}',
              trust: ${JSON.stringify(trust)},
              updateContainerProps: (updateProps) => {
                const originalProps = props;
                // if nothing has changed, the same [props] object will be returned
                props = updateProps(props);
                if (props !== originalProps) {
                  Preact.render(html\`\<\${BWEComponent} />\`, document.body);
                }
              },
            },
          });

          // intialize props
          props = containerProps;

          /* BEGIN BOS SOURCE */
          /* The root Component definition is inlined here as [function BWEComponent() {...}] */
          ${scriptSrc}
          /* END BOS SOURCE */

          function buildBWEComponentNode(node, children) {
            const { id, src, __bweMeta } = node.props;
            const componentId = [src, id, __bweMeta?.parentMeta?.componentId].join('##');

            return {
              type: 'div',
              props: {
                id: 'dom-' + componentId,
                className: 'bwe-component-container',
                children,
                "data-component-src": src,
              },
            };
          }

          const isBWEComponent = (node) => node.type?.name?.startsWith?.('BWEComponent') || false;

          function buildComponentTree(rootNode, componentTree) {
            if (!rootNode || typeof rootNode !== 'object') {
              return rootNode;
            }
            
            const currentNode = isBWEComponent(rootNode)
              ? buildBWEComponentNode(rootNode, componentTree.get(rootNode))
              : rootNode;
            
             const children = [currentNode.props?.children || []]
              .flat()
              .map((child) => {
                // ignore non-Component children and Widget references (<Widget /> is serialized later)
                if (child.type === Widget || typeof child.type !== 'function') {
                  return child; 
                }

                const componentChildren = componentTree.get(child);
                if (isBWEComponent(child)) {
                  return buildBWEComponentNode(child, componentChildren);
                }

                // external Preact Component
                return {
                  type: 'div',
                  props: {
                    // id: child.props.id,
                    className: 'preact-component-container',
                    children: componentChildren,
                  },
                };
              });

            return {
              ...currentNode,
              props: {
                ...currentNode.props,
                children: [children]
                  .flat()
                  .map((child) => buildComponentTree(child, componentTree)),
              },
            };
          }

          // find all Component leaf nodes in the given Preact node's Component tree
          function getComponentLeafNodes(node) {
            const { children } = node?.props || [];
            if (typeof children !== 'object') {
              return [];
            }

            return [children].flat().reduce(
              (descendants, child) => typeof child.type === 'function'
                ? [...descendants, child]
                : [
                    ...descendants,
                    ...(!child?.props?.children ? [] : getComponentLeafNodes(child))
                  ]
            , []);
          }

          const componentRoots = new Map();
          let remainingSubtrees = 0;
          let currentRoot = null;

          const RENDER_TIMEOUT_MS = 5;
          let renderTimer = null;
              
          const oldDiff = Preact.options.__b;
          Preact.options.__b = (vnode) => {
            const parent = vnode.__;

            const isRootFragment = vnode.type === Preact.Fragment && vnode.props?.children?.[0]?.type === BWEComponent;
            const isRootComponent = vnode.type === BWEComponent && parent.type === Preact.Fragment;
          
            // if the parent Component is a function, the current vnode is a DOM root for a Component tree
            if (typeof parent?.type === 'function' && !isRootFragment && !isRootComponent) {
              // a new Component DOM tree has been emitted, clear the timer
              if (renderTimer) {
                clearTimeout(renderTimer);
                renderTimer = null;
              }

              // set the root Component to the current parent
              if (!currentRoot) {
                currentRoot = parent;
              }

              // initialize the list of children under the current parent Component's node and add the current node
              if (!componentRoots.has(parent)) {
                componentRoots.set(parent, []);
              }
              componentRoots.get(parent).push(vnode);

              // add the number of Component leaf nodes in this node's tree
              remainingSubtrees += getComponentLeafNodes(vnode).length;

              const renderComponentSubtree = () => {
                dispatchRender(buildComponentTree(currentRoot, componentRoots));
                componentRoots.clear();
                currentRoot = null;
              };

              const isRootChild = currentRoot === parent;
              if (remainingSubtrees && !isRootChild) {
                remainingSubtrees--;
                if (remainingSubtrees === 0) {
                  renderComponentSubtree();
                }
              } else if (isRootChild) {
                // the number of root children is not known in advance, set a timeout
                // to proceed with the render if the current node is a root child
                // the timer will be cleared when the next node is emitted 
                renderTimer = setTimeout(renderComponentSubtree, RENDER_TIMEOUT_MS);
              }
            }

            oldDiff?.(vnode);
          };

          window.addEventListener('message', processEvent);

          Preact.render(html\`\<\${BWEComponent} />\`, document.body);
        </script>
      </body>
    </html>
  `;
}

interface SandboxedIframeProps {
  id: string;
  trust: ComponentTrust;
  scriptSrc: string;
  componentProps?: any;
  parentContainerId: string | null;
}

export function SandboxedIframe({
  id,
  trust,
  scriptSrc,
  componentProps,
  parentContainerId,
}: SandboxedIframeProps) {
  return (
    <iframe
      id={id}
      className="sandboxed-iframe"
      // @ts-expect-error: you're wrong about this one, TypeScript
      csp={[
        "default-src 'self'",
        'connect-src *',
        'img-src * data:',
        "script-src 'unsafe-inline' 'unsafe-eval'",
        "script-src-elem https://cdn.jsdelivr.net https://esm.sh http://localhost http://localhost:3001 'unsafe-inline'",
        '',
      ].join('; ')}
      height={0}
      sandbox="allow-scripts"
      srcDoc={buildSandboxedComponent({
        id: id.replace('iframe-', ''),
        trust,
        scriptSrc,
        componentProps,
        parentContainerId,
      })}
      title="code-container"
      width={0}
      style={{ border: 'none' }}
    />
  );
}
