import {
  WidgetActivityMonitor,
  WidgetMonitor,
} from '@bos-web-engine/application';
import { getAppDomId, getIframeId, SandboxedIframe } from '@bos-web-engine/iframe';
import React, { useState } from 'react';

import { useWebEngine } from '../hooks';

const DEFAULT_ROOT_WIDGET = 'andyh.near/widget/MainPage';

const monitor = new WidgetActivityMonitor();

export default function Web() {
  const [rootWidget, setRootWidget] = useState('');
  const [rootWidgetInput, setRootWidgetInput] = useState(DEFAULT_ROOT_WIDGET);
  const [showMonitor, setShowMonitor] = useState(true);
  const [showWidgetDebug, setShowWidgetDebug] = useState(true);

  const { components } = useWebEngine({
    monitor,
    showWidgetDebug,
    rootWidget,
  });

  return (
    <div className='App'>
      {!rootWidget && (
        <div id='init-widget'>
          <div>
            <input
              type='text'
              value={rootWidgetInput}
              style={{ width: '400px' }}
              onChange={(e) => setRootWidgetInput(e.target.value)}
            />
            <button onClick={() => setRootWidget(rootWidgetInput)}>
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
      {rootWidget && (
        <>
          {showMonitor && <WidgetMonitor monitor={monitor} />}
          <div id={getAppDomId(rootWidget)} className='iframe'>
            root widget goes here
          </div>
          <div className="iframes">
            {showWidgetDebug && (<h5>here be hidden iframes</h5>)}
            {
              Object.entries(components)
                .filter(([, component]) => !!component?.widgetComponent)
                .map(([widgetId, { isTrusted, props, widgetComponent }]) => (
                  <div key={widgetId} widget-id={widgetId}>
                    <SandboxedIframe
                      id={getIframeId(widgetId)}
                      isTrusted={isTrusted}
                      scriptSrc={widgetComponent}
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
