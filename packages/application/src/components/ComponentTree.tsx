import { SandboxedIframe } from './SandboxedIframe';
import { getAppDomId, getIframeId } from '../container';

interface ComponentTreeParams {
  components: { [componentId: string]: any };
  rootComponentPath: string;
}

export default function ComponentTree({
  components,
  rootComponentPath,
}: ComponentTreeParams) {
  return (
    <div className="App" key={rootComponentPath}>
      <>
        <div
          id={getAppDomId(rootComponentPath)}
          className="container-child"
        ></div>
        <div className="iframes">
          {Object.entries(components)
            .filter(([, component]) => !!component?.componentSource)
            .map(
              ([
                componentId,
                { trust, props, componentSource, parentId, moduleImports },
              ]) => (
                <div key={componentId} component-id={componentId}>
                  <SandboxedIframe
                    id={getIframeId(componentId)}
                    trust={trust}
                    scriptSrc={componentSource}
                    componentProps={props}
                    parentContainerId={parentId}
                    moduleImports={moduleImports}
                  />
                </div>
              )
            )}
        </div>
      </>
    </div>
  );
}
