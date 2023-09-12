import {
  ComponentMonitor,
} from '@bos-web-engine/application';
import { getAppDomId, getIframeId, SandboxedIframe } from '@bos-web-engine/iframe';
import { useState } from 'react';

import { useWebEngine } from '../hooks';

const DEFAULT_ROOT_WIDGET = 'andyh.near/widget/MainPage';

export default function Web() {
  const [rootComponentPath, setRootComponentPath] = useState('');
  const [rootComponentPathInput, setRootComponentPathInput] = useState(DEFAULT_ROOT_WIDGET);
  const [showMonitor, setShowMonitor] = useState(true);
  const [showWidgetDebug, setShowWidgetDebug] = useState(true);

  const { components, metrics } = useWebEngine({
    showWidgetDebug,
    rootComponentPath,
  });

  return (
    <div className='App'>
      {!rootComponentPath && (
        <div id='init-widget'>
          <div>
            <input
              type='text'
              value={rootComponentPathInput}
              style={{ width: '400px' }}
              onChange={(e) => setRootComponentPathInput(e.target.value)}
            />
            <button onClick={() => setRootComponentPath(rootComponentPathInput)}>
              Update Root Widget
            </button>
          </div>
          <div className='debug-option'>
            <input
              type="checkbox"
              onChange={(e) => setShowMonitor(e.target.checked)}
              checked={showMonitor}
            />
            <span>Show Monitor</span>
          </div>
          <div className='debug-option'>
            <input
              type="checkbox"
              onChange={(e) => setShowWidgetDebug(e.target.checked)}
              checked={showWidgetDebug}
            />
            <span>Show Widget Debug</span>
          </div>
        </div>
      )}
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
