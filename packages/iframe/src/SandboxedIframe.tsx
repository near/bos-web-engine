import type { ComponentTrust } from '@bos-web-engine/common';
import {
  buildUseComponentCallback,
  initNear,
  initSocial,
  buildEventHandler,
  invokeCallback,
  invokeComponentCallback,
  buildRequest,
  postMessage,
  postCallbackInvocationMessage,
  postCallbackResponseMessage,
  postComponentRenderMessage,
  deserializeProps,
  serializeArgs,
  serializeNode,
  serializeProps,
  decodeJsonString,
  encodeJsonString,
  getBuiltins,
  inlineGlobalDefinition,
  dispatchRenderEvent,
} from '@bos-web-engine/container';

function buildSandboxedComponent({
  id,
  trust,
  scriptSrc,
  componentProps,
  parentContainerId,
}: SandboxedIframeProps) {
  const componentPath = id.split('::')[0];
  let jsonComponentProps = '{}';
  if (componentProps) {
    jsonComponentProps = encodeJsonString(JSON.stringify(componentProps));
  }

  return `
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/near-api-js@2.1.3/dist/near-api-js.min.js"></script>
      </head>
      <body>
        <div id="${id}"></div>
          <script type="importmap">
          {
            "imports": {
              "preact": "https://esm.sh/preact@10.17.1",
              "preact/": "https://esm.sh/preact@10.17.1/"
            }
          }
          </script>
        <script type="module">
          import { createElement, render, options, Fragment as __Fragment } from 'preact';
          import { useEffect, useState } from 'preact/hooks';

          const PREACT_ROOT_COMPONENT_NAME = __Fragment.name;

          /* generated code for ${componentPath} */
          const callbacks = {};
          const requests = {};

          ${inlineGlobalDefinition('dispatchRenderEvent', dispatchRenderEvent)}
          ${inlineGlobalDefinition('buildRequest', buildRequest)}
          ${inlineGlobalDefinition('postMessage', postMessage)}
          ${inlineGlobalDefinition(
            'postComponentRenderMessage',
            postComponentRenderMessage
          )}
          ${inlineGlobalDefinition(
            'postCallbackInvocationMessage',
            postCallbackInvocationMessage
          )}
          ${inlineGlobalDefinition(
            'postCallbackResponseMessage',
            postCallbackResponseMessage
          )}

          ${inlineGlobalDefinition('decodeJsonString', decodeJsonString)}
          ${inlineGlobalDefinition('deserializeProps', deserializeProps)}
          ${inlineGlobalDefinition('encodeJsonString', encodeJsonString)}
          ${inlineGlobalDefinition('serializeArgs', serializeArgs)}
          ${inlineGlobalDefinition('serializeNode', serializeNode)}
          ${inlineGlobalDefinition('serializeProps', serializeProps)}

          ${inlineGlobalDefinition('invokeCallback', invokeCallback)}
          ${inlineGlobalDefinition(
            'invokeComponentCallback',
            invokeComponentCallback
          )}
          
          const buildUseComponentCallback = ${buildUseComponentCallback.toString()};
          const useComponentCallback = buildUseComponentCallback(renderComponent);

          const builtinComponents = ${getBuiltins.toString()}({ createElement });

          // builtin components must have references defined in order for the Component to render
          // builtin components are resolved during serialization 
          function Checkbox() {}
          function CommitButton() {}
          function Dialog() {}
          function DropdownMenu() {}
          function Files() {}
          function Fragment() {}
          function InfiniteScroll() {}
          function IpfsImageUpload() {}
          function Link() {}
          function Markdown() {}
          function OverlayTrigger() {}
          function Tooltip() {}
          function Typeahead() {}
          function Widget() {}
          
          // cache previous renders
          const nodeRenders = new Map();
          
          // register handler executed upon vnode render
          const hooksDiffed = options.diffed;
          options.diffed = (vnode) => {
            // TODO this handler will fire for every descendant node rendered,
            //  could be a good way to optimize renders within a container without
            //  re-rendering the entire thing
            const [containerComponent] = vnode.props?.children || [];
            if (containerComponent && vnode.type?.name === PREACT_ROOT_COMPONENT_NAME) {
              dispatchRenderEvent({
                builtinComponents,
                callbacks,
                componentId: '${id}',
                node: containerComponent(),
                nodeRenders,
                postComponentRenderMessage,
                preactRootComponentName: PREACT_ROOT_COMPONENT_NAME,
                serializeNode,
                trust: '${JSON.stringify(trust)}',
              });
            }
            hooksDiffed?.(vnode);
          };

          /* NS shims */
          function buildSafeProxy(p) {
            return new Proxy({ ...p, __bweMeta: { componentId: '${id}', isProxy: true } }, {
              get(target, key) {
                try {
                  return target[key];                
                } catch {
                  return undefined;
                }
              }
            });
          }

          let props = buildSafeProxy(deserializeProps({
            buildRequest,
            callbacks,
            componentId: '${id}',
            parentContainerId: '${parentContainerId}',
            postCallbackInvocationMessage,
            props: JSON.parse('${jsonComponentProps
              .replace(/'/g, "\\'")
              .replace(/\\"/g, '\\\\"')}'),
            requests,
          }));

          function asyncFetch(url, options) {
            return fetch(url, options)
              .catch(console.error);
          }

          const Near = (${initNear.toString()})({
            renderComponent,
            rpcUrl: 'https://rpc.near.org',
          });

          const Social = (${initSocial.toString()})({
            endpointBaseUrl: 'https://api.near.social',
            renderComponent,
            sanitizeString: encodeJsonString,
            componentId: '${id}',
          });

          const React = {
            Fragment: 'div',
          };
          function fadeIn() {}
          function slideIn() {}
          let minWidth;

          const styled = new Proxy({}, {
            get(target, property, receiver) {
              return (css) => {
                return property;
              };
            }
          });

          // TODO remove debug value
          const context = buildSafeProxy({ accountId: props.accountId || 'andyh.near' });
          
          const ComponentState = new Map();

                /* BEGIN EXTERNAL SOURCE */
                ${scriptSrc}
                /* END EXTERNAL SOURCE */
      
          const stateUpdates = new Map();

          function renderComponent({ stateUpdate } = {}) {
            try {
              // TODO remove this kludge-y stopgap preventing State.update() calls on render from triggering cascading renders.
              //  This likely has unintended consequences for Components calling State.update() at render time, but that should
              //  be considered an antipattern to be replaced by a [useEffect] implementation.
              if (stateUpdate) {
                if (!stateUpdates.has(stateUpdate)) {
                  stateUpdates.set(stateUpdate, []);
                }

                const updates = stateUpdates.get(stateUpdate);
                stateUpdates.set(stateUpdate, [...updates, (new Date()).valueOf()]);
                if (updates.length > 5) {
                  return;
                }
              }

              try {
                render(BWEComponent, document.getElementById('${id}'));
              } catch (e) {
                console.error(e, { componentId: '${id.split('##')[0]}' });
                return createElement(
                  'div',
                  {},
                  'failed to load ${
                    componentPath.split('##')[0]
                  }: ' + e.toString() + '\\n\\n' + e.stack
                );
              }
            } catch (e) {
              console.error(e, { componentId: '${id}' });
            }
          }
          
          renderComponent();

          function preactify(node) {
            if (!node || typeof node !== 'object') {
              return node;
            }

            const { props, type } = node;
            // TODO handle other builtins
            const isComponent = !!props.src?.match(/[0-9a-z._-]{5,}\\/widget\\/[0-9a-z._-]+/ig);
            const { children } = props;

            return createElement(
              isComponent ? Widget : type,
              { ...props, key: node.key || props.key },
              Array.isArray(children) ? children.map(preactify) : preactify(children)
            );
          }

          function isMatchingProps(props, compareProps) {
            const getComparable = (p) => Object.keys(p)
              .sort()
              .filter((k) => k !== '__bweMeta')
              .map((propKey) => propKey + '::' + p[propKey])
              .join(',');

            return getComparable(props) === getComparable(compareProps);
          }

          const processEvent = (${buildEventHandler.toString()})({
            buildRequest,
            builtinComponents,
            callbacks,
            deserializeProps,
            invokeCallback,
            invokeComponentCallback,
            parentContainerId: '${parentContainerId}',
            postCallbackInvocationMessage,
            postCallbackResponseMessage,
            preactRootComponentName: PREACT_ROOT_COMPONENT_NAME,
            renderDom: (node) => preactify(node),
            renderComponent,
            requests,
            serializeArgs,
            serializeNode,
            setProps: (newProps) => {
              if (isMatchingProps({ ...props }, newProps)) {
                return false;
              }

              props = buildSafeProxy({ ...props, ...newProps });
              return true;
            },
            componentId: '${id}'
          });

          window.addEventListener('message', processEvent);
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
