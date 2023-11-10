import type { ComponentTrust } from '@bos-web-engine/common';
import {
  buildUseComponentCallback,
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
          ${scriptSrc}
          /* END BOS SOURCE */

          const componentTree = new Map();

          function buildComponentTree(rootComponent, componentTree) {
            if (!rootComponent || typeof rootComponent !== 'object') {
              return rootComponent;
            }

            const children = rootComponent.props?.children || [];

            return {
              ...rootComponent,
              props: {
                ...rootComponent.props,
                children: (Array.isArray(children) ? children : [children]).map((child) => {
                  // ignore the emitted vnode for inlined <BWEComponent_* /> components
                  // use its child instead, which is the root for the trusted Component's DOM
                  return child.type?.name?.startsWith('BWEComponent')
                    ? buildComponentTree(componentTree.get(child)[0], componentTree)
                    : buildComponentTree(child, componentTree);
                }),
              }
            }
          }
          // register handler executed upon vnode render
          const oldDiffed = Preact.options._diff;
          Preact.options.diffed = (vnode) => {
            const isBWEComponent = vnode.type?.name === 'BWEComponent';

            if (isBWEComponent) {
              // store the top-level children and remove the entry mapping them to <BWEComponent />
              const componentChildren = componentTree.get(vnode);
              componentTree.delete(vnode);

              // create artificial root node
              // TODO look into sending array of top-level children instead
              const componentRoot = {
                type: 'div',
                props: {
                  id: '${id}',
                  children: componentChildren,
                  className: 'component-container',
                  "data-component-src": '${id}'.split('##')[0],                
                },
              };

              // map artificial component root node to top-level children
              componentTree.set(componentRoot, componentChildren);

              // request render
              dispatchRender(buildComponentTree(componentRoot, componentTree));

              // clear component tree for next render
              componentTree.clear();
            } else {
              const parent = vnode.__;
              if (!componentTree.has(parent)) {
                componentTree.set(parent, []);
              }

              componentTree.get(parent).push(vnode);
            }

            oldDiffed?.(vnode);
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
