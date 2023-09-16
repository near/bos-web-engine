import {
  ComponentMonitor,
} from '@bos-web-engine/application';
import { getAppDomId, getIframeId, SandboxedIframe } from '@bos-web-engine/iframe';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { useWebEngine } from '../../hooks';

export default function Web() {
  const router = useRouter();
  const rootComponentPath = (router.query.root as string[])?.join?.('/');
  const [showMonitor, setShowMonitor] = useState(true);
  const [showWidgetDebug, setShowWidgetDebug] = useState(true);

  const { components, metrics } = useWebEngine({
    showWidgetDebug,
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
            {showWidgetDebug && (<h5>here be hidden iframes</h5>)}
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
