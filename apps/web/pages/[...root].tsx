import {
  ComponentMonitor,
} from '@bos-web-engine/application';
import { getAppDomId, getIframeId, SandboxedIframe } from '@bos-web-engine/iframe';
import { useRouter } from 'next/router';

import { useWebEngine } from '../hooks';

export default function Web() {
  const router = useRouter();
  const { query } = router;

  const isDebug = query.isDebug === 'true';
  const showMonitor = query.showMonitor === 'true';
  const rootComponentPath = ((query.root || []) as string[]).join('/');

  const { components, metrics } = useWebEngine({
    showWidgetDebug: isDebug,
    rootComponentPath,
  });

  return (
    <div className='App'>
      {rootComponentPath && (
        <>
          {showMonitor && <ComponentMonitor metrics={metrics} components={Object.values(components)} />}
          <div id={getAppDomId(rootComponentPath)} className='iframe'>
            root widget goes here
          </div>
          <div className="iframes">
            {isDebug && (<h5>[hidden iframes]</h5>)}
            {
              Object.entries(components)
                .filter(([, component]) => !!component?.componentSource)
                .map(([widgetId, { isTrusted, props, componentSource }]) => (
                  <div key={widgetId} widget-id={widgetId}>
                    <SandboxedIframe
                      id={getIframeId(widgetId)}
                      isTrusted={isTrusted}
                      scriptSrc={componentSource}
                      widgetProps={props}
                    />
                  </div>
                ))
            }
          </div>
        </>
      )}
    </div>
  );
}
