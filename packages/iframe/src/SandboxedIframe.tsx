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
  composeRenderMethods,
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
            diffed,
            dispatchRender,
            processEvent,
            props: containerProps,
          } = initContainer({
            containerMethods: {
              buildEventHandler: ${buildEventHandler.toString()},
              buildRequest: ${buildRequest.toString()},
              buildSafeProxy: ${buildSafeProxy.toString()},
              composeMessagingMethods: ${composeMessagingMethods.toString()},
              composeRenderMethods: ${composeRenderMethods.toString()},
              composeSerializationMethods: ${composeSerializationMethods.toString()},
              dispatchRenderEvent: ${dispatchRenderEvent.toString()},
              invokeCallback: ${invokeCallback.toString()},
              invokeComponentCallback: ${invokeComponentCallback.toString()},
              isMatchingProps: ${isMatchingProps.toString()},
              preactify: ${preactify.toString()},
            },
            context: {
              BWEComponent,
              Component: Widget,
              componentId: '${id}',
              componentPropsJson: ${componentPropsJson},
              createElement,
              Fragment: Preact.Fragment,
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
              
          const oldDiff = Preact.options.__b;
          Preact.options.__b = (vnode) => {
            diffed(vnode);
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
