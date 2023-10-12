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
  initContainer,
  isMatchingProps,
  preactify,
  renderContainerComponent,
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

          ${inlineGlobalDefinition('buildEventHandler', buildEventHandler)}
          ${inlineGlobalDefinition('initContainer', initContainer)}
          ${inlineGlobalDefinition('isMatchingProps', isMatchingProps)}
          const preactify = ${preactify.toString()}
          const renderContainerComponent = ${renderContainerComponent.toString()}

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

          const builtinPlaceholders = { Widget };

          const {
            diffComponent,
            processEvent,
            renderComponent,
          } = initContainer({
            containerMethods: {
              buildEventHandler,
              buildRequest,
              deserializeProps,
              dispatchRenderEvent,
              invokeCallback,
              invokeComponentCallback,
              postCallbackInvocationMessage,
              postCallbackResponseMessage,
              postComponentRenderMessage,
              preactify,
              serializeArgs,
              serializeNode,
            },
            context: {
              builtinComponents,
              builtinPlaceholders,
              BWEComponent,
              callbacks,
              componentId: '${id}',
              createElement,
              parentContainerId: '${parentContainerId}',
              preactHooksDiffed: options.diffed,
              preactRootComponentName: PREACT_ROOT_COMPONENT_NAME,
              render,
              renderContainerComponent,
              requests,
              setProps: (newProps) => {
                if (isMatchingProps({ ...props }, newProps)) {
                  return false;
                }
  
                props = buildSafeProxy({ ...props, ...newProps });
                return true;
              },
              trust: '${JSON.stringify(trust)}',
            },
          });
      
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

          const buildUseComponentCallback = ${buildUseComponentCallback.toString()};
          const useComponentCallback = buildUseComponentCallback(renderComponent);

          // TODO remove debug value
          const context = buildSafeProxy({ accountId: props.accountId || 'andyh.near' });
          
          const ComponentState = new Map();

          /* BEGIN EXTERNAL SOURCE */
          ${scriptSrc}
          /* END EXTERNAL SOURCE */

          // register handler executed upon vnode render
          options.diffed = diffComponent;

          window.addEventListener('message', processEvent);

          // first render once container is initialized
          // this should always happen last
          renderComponent();
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
