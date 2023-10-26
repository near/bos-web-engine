import type { ComponentTrust } from '@bos-web-engine/common';
import {
  buildUseComponentCallback,
  buildEventHandler,
  invokeCallback,
  invokeComponentCallback,
  buildRequest,
  postMessage,
  postCallbackInvocationMessage,
  postCallbackResponseMessage,
  postComponentRenderMessage,
  decodeJsonString,
  encodeJsonString,
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
    ? JSON.stringify(componentProps)
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
          import * as Preact from 'preact';
          import { useEffect, useState } from 'preact/hooks';

          const { createElement } = Preact;

          const initContainer = ${initContainer.toString()};

          // placeholder to prevent <Widget /> references from breaking 
          function Widget() {}

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
            processEvent,
            props: containerProps,
            renderComponent,
            useComponentCallback,
          } = initContainer({
            containerMethods: {
              buildEventHandler: ${buildEventHandler.toString()},
              buildRequest: ${buildRequest.toString()},
              buildSafeProxy: ${buildSafeProxy.toString()},
              buildUseComponentCallback: ${buildUseComponentCallback.toString()},
              composeSerializationMethods: ${composeSerializationMethods.toString()},
              decodeJsonString: ${decodeJsonString.toString()},
              dispatchRenderEvent: ${dispatchRenderEvent.toString()},
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
              Component: Widget,
              componentId: '${id}',
              componentPropsJson: ${componentPropsJson},
              /* "function BWEComponent() {...}" is added to module scope when [scriptSrc] is interpolated */
              ContainerComponent: BWEComponent,
              createElement,
              parentContainerId: '${parentContainerId}',
              preactHooksDiffed: Preact.options.diffed,
              preactRootComponentName: Preact.Fragment.name,
              render: Preact.render,
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
          Preact.options.diffed = diffComponent;

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
