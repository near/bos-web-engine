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
    <div className="App">
      <>
        {showMonitor && (
          <ComponentMonitor
            metrics={metrics}
            components={Object.values(components)}
          />
        )}
        <div id={getAppDomId(rootComponentPath)} className="iframe">
          {isDebug && '[root component placeholder]'}
        </div>
        <div className="iframes">
          {isDebug && <h5>[hidden iframes]</h5>}
          {Object.entries(components)
            .filter(([, component]) => !!component?.componentSource)
            .map(
              ([
                componentId,
                { isTrusted, props, componentSource, parentId },
              ]) => (
                <div key={componentId} component-id={componentId}>
                  <SandboxedIframe
                    id={getIframeId(componentId)}
                    isTrusted={isTrusted}
                    scriptSrc={componentSource}
                    componentProps={props}
                    parentContainerId={parentId}
                  />
                </div>
              )
            )}
        </div>
      </>
    </div>
  );
}
