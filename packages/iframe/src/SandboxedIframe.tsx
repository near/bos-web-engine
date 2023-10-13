import type { ComponentTrust } from '@bos-web-engine/common';
import {
  buildUseComponentCallback,
  buildEventHandler,
  composeApiMethods,
  invokeCallback,
  invokeComponentCallback,
  buildRequest,
  postMessage,
  postCallbackInvocationMessage,
  postCallbackResponseMessage,
  postComponentRenderMessage,
  decodeJsonString,
  encodeJsonString,
  getBuiltins,
  dispatchRenderEvent,
  initContainer,
  isMatchingProps,
  preactify,
  renderContainerComponent,
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
    ? encodeJsonString(JSON.stringify(componentProps))
    : '{}';

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

          const initContainer = ${initContainer.toString()};

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

          let props;

          const {
            /* VM shims */
            asyncFetch,
            fadeIn,
            minWidth,
            React,
            slideIn,
            styled,
            /* core dependencies */
            context,
            diffComponent,
            Near,
            processEvent,
            props: containerProps,
            renderComponent,
            Social,
            useComponentCallback,
          } = initContainer({
            containerMethods: {
              buildEventHandler: ${buildEventHandler.toString()},
              buildRequest: ${buildRequest.toString()},
              buildSafeProxy: ${buildSafeProxy.toString()},
              buildUseComponentCallback: ${buildUseComponentCallback.toString()},
              composeApiMethods: ${composeApiMethods.toString()},
              composeSerializationMethods: ${composeSerializationMethods.toString()},
              decodeJsonString: ${decodeJsonString.toString()},
              dispatchRenderEvent: ${dispatchRenderEvent.toString()},
              encodeJsonString: ${encodeJsonString.toString()},
              getBuiltins: ${getBuiltins.toString()},
              invokeCallback: ${invokeCallback.toString()},
              invokeComponentCallback: ${invokeComponentCallback.toString()},
              isMatchingProps: ${isMatchingProps.toString()},
              postCallbackInvocationMessage: ${postCallbackInvocationMessage.toString()},
              postCallbackResponseMessage: ${postCallbackResponseMessage.toString()},
              postComponentRenderMessage: ${postComponentRenderMessage.toString()},
              postMessage: ${postMessage.toString()},
              preactify: ${preactify.toString()},
              renderContainerComponent: ${renderContainerComponent.toString()},
            },
            context: {
              builtinPlaceholders,
              BWEComponent,
              componentId: '${id}',
              componentPropsJson: '${componentPropsJson}',
              createElement,
              parentContainerId: '${parentContainerId}',
              preactHooksDiffed: options.diffed,
              preactRootComponentName: PREACT_ROOT_COMPONENT_NAME,
              render,
              rpcUrl: 'https://rpc.near.org',
              socialApiUrl: 'https://api.near.social',
              trust: '${JSON.stringify(trust)}',
              updateContainerProps: (updateProps) => {
                const originalProps = props;
                // if nothing has changed, the same [props] object will be returned
                props = updateProps(props);
                if (props !== originalProps) {
                  renderComponent();
                }
              },
            },
          });

          // initialize container state
          const ComponentState = new Map();

          // intialize props
          props = containerProps;

          /* BEGIN BOS SOURCE */
          ${scriptSrc}
          /* END BOS SOURCE */

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
