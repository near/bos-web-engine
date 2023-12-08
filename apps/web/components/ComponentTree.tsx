import { ComponentMonitor } from '@bos-web-engine/application';
import {
  getAppDomId,
  getIframeId,
  SandboxedIframe,
} from '@bos-web-engine/iframe';

interface ComponentTreeParams {
  components: { [componentId: string]: any };
  isDebug: boolean;
  metrics: any;
  rootComponentPath: string;
  showMonitor: boolean;
}

export default function ComponentTree({
  components,
  isDebug,
  metrics,
  rootComponentPath,
  showMonitor,
}: ComponentTreeParams) {
  return (
    <div className={`App ${isDebug ? 'bwe-debug' : ''}`}>
      <>
        {showMonitor && (
          <ComponentMonitor
            metrics={metrics}
            components={Object.values(components)}
          />
        )}
        <div id={getAppDomId(rootComponentPath)} className="container-child">
          {isDebug && '[root component placeholder]'}
        </div>
        <div className="iframes">
          {isDebug && <h5>[hidden iframes]</h5>}
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
