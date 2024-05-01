import { SandboxedIframe } from './SandboxedIframe';
import { getAppDomId, getIframeId } from '../container';

interface ComponentTreeParams {
  currentUserAccountId?: string | undefined;
  components: { [componentId: string]: any };
  rootComponentPath: string;
}

export default function ComponentTree({
  currentUserAccountId,
  components,
  rootComponentPath,
}: ComponentTreeParams) {
  return (
    <>
      <div
        id={getAppDomId(rootComponentPath)}
        className="container-child"
        data-component-src={rootComponentPath}
      />

      <div
        className="iframes"
        style={{ position: 'absolute', visibility: 'hidden' }}
      >
        {Object.entries(components)
          .filter(([, component]) => !!component?.componentSource)
          .map(
            ([
              componentId,
              {
                trust,
                props,
                componentSource,
                parentId,
                moduleImports,
                queryParams,
              },
            ]) => (
              /*
                NOTE: Including currentUserAccountId as part of the key forces the entire tree 
                to rerender whenever the currently signed in wallet changes. This allows the 
                getAccounts() method (provided by wallet-selector-plugin) to be called again 
                in any components that are relying on it. This will then provide those components 
                with the correct, current state for getAccounts() - without requiring a full page 
                refresh.
              */

              <div
                key={componentId + currentUserAccountId}
                component-id={componentId}
              >
                <SandboxedIframe
                  id={getIframeId(componentId)}
                  trust={trust}
                  scriptSrc={componentSource}
                  componentProps={{ ...queryParams, ...props }}
                  parentContainerId={parentId}
                  moduleImports={moduleImports}
                />
              </div>
            )
          )}
      </div>
    </>
  );
}
