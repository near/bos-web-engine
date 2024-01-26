import type { ComponentTrust } from '@bos-web-engine/common';
import {
  buildEventHandler,
  invokeCallback,
  invokeComponentCallback,
  buildRequest,
  composeMessagingMethods,
  initContainer,
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
  moduleImports,
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
              ${[...moduleImports.entries()]
                .map(([module, url]) => `"${module}": "${url}"`)
                .join(',\n')}
            }
          }
        </script>
        <script type="module">
            import * as __Preact from 'preact';

/******** BEGIN BOS SOURCE ********/
/******** The root Component definition is inlined here as [function BWEComponent() {...}] ********/
${scriptSrc}
/******** END BOS SOURCE ********/

          const initContainer = ${initContainer.toString()};

          // placeholder function to bind Component references in BOS Component source
          function Component() {}

          let props;

          // TODO bind/replace React.Fragment during transpilation and remove this shim
          if (typeof React === 'undefined') {
            window.React = {};
          }
          React.Fragment = __Preact.Fragment ;

          const {
            commit,
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
              invokeCallback: ${invokeCallback.toString()},
              invokeComponentCallback: ${invokeComponentCallback.toString()},
            },
            context: {
              BWEComponent,
              Component,
              componentId: '${id}',
              componentPropsJson: ${componentPropsJson},
              Fragment: __Preact.Fragment,
              parentContainerId: '${parentContainerId}',
              trust: ${JSON.stringify(trust)},
              updateContainerProps: (updateProps) => {
                const originalProps = props;
                // if nothing has changed, the same [props] object will be returned
                props = updateProps(props);
                if (props !== originalProps) {
                  __Preact.render(createElement(BWEComponent, props), document.body);
                }
              },
            },
          });

          // intialize props
          props = containerProps;

          const oldCommit = __Preact.options.__c;
          __Preact.options.__c = (vnode, commitQueue) => {
            commit(vnode);
            oldCommit?.(vnode, commitQueue);
          };

          window.addEventListener('message', processEvent);

          __Preact.render(__Preact.createElement(BWEComponent, props), document.body);
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
  moduleImports: Map<string, string>;
}

export function SandboxedIframe({
  id,
  trust,
  scriptSrc,
  componentProps,
  parentContainerId,
  moduleImports,
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
        moduleImports,
      })}
      title="code-container"
      width={0}
      style={{ border: 'none' }}
    />
  );
}
