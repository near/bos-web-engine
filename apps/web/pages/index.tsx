import {
  WidgetActivityMonitor,
  WidgetMonitor,
  WidgetUpdate,
  WidgetDOMElement,
  onCallbackInvocation,
  onCallbackResponse,
  onRender,
  postMessageToIframe,
} from '@bos-web-engine/application';
import { getAppDomId, getIframeId, SandboxedIframe } from '@bos-web-engine/iframe';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import Transpiler from './transpiler';

const LOCAL_PROXY_WIDGET_URL_PREFIX = 'http://localhost:3001/widget';
const DEFAULT_ROOT_WIDGET = 'andyh.near/widget/MainPage';

const roots = {} as { [key: string]: ReactDOM.Root };
const widgets = {} as { [key: string]: any };

const monitor = new WidgetActivityMonitor();

function mountElement({ widgetId, element }: { widgetId: string, element: WidgetDOMElement }) {
  if (!roots[widgetId]) {
    const domElement = document.getElementById(getAppDomId(widgetId));
    if (!domElement) {
      const metricKey = widgetId.split('##')[0];
      monitor.missingWidgetReferenced(metricKey);
      console.error(`Node not found: #${getAppDomId(widgetId)}`);
      return;
    }

    roots[widgetId] = ReactDOM.createRoot(domElement);
  }

  roots[widgetId].render(element);
}

function requestWidgetSource(widgetPath: string) {
  postMessageToIframe({
    id: 'transpiler',
    message: {
      source: widgetPath,
      type: 'transpiler.widgetFetch',
    },
    targetOrigin: '*',
  });
}

export default function Web() {
  const [rootWidget, setRootWidget] = useState('');
  const [rootWidgetInput, setRootWidgetInput] = useState(DEFAULT_ROOT_WIDGET);
  const [rootWidgetSource, setRootWidgetSource] = useState(null);
  const [widgetUpdates, setWidgetUpdates] = useState('');
  const [showMonitor, setShowMonitor] = useState(true);
  const [showWidgetDebug, setShowWidgetDebug] = useState(false);

  const widgetProxy = new Proxy(widgets, {
    get(target, key: string) {
      return target[key];
    },

    set(target, key: string, value: any) {
      // if the widget is being added, initiate request for widget component code
      if (!target[key]) {
        requestWidgetSource(key);
      }

      target[key] = value;
      return true;
    },
  });

  useEffect(() => {
    function buildMessageListener(eventType: string) {
      return function (event: any) {
        try {
          if (typeof event.data !== 'object' || event.data.type !== eventType) {
            return;
          }

          const { data } = event;
          switch (eventType) {
              case 'transpiler.sourceTranspiled': {
                const { source, widgetComponent } = data;
                const widget = { ...widgetProxy[source], widgetComponent };
                if (!rootWidgetSource && source == rootWidget) {
                  setRootWidgetSource(source);
                }
                monitor.widgetAdded(widget);
                setWidgetUpdates(widgetUpdates + source);
                widgetProxy[source] = widget;
                break;
              }
              case 'widget.callbackInvocation': {
                monitor.widgetCallbackInvoked(data);
                onCallbackInvocation({ data });
                break;
              }
              case 'widget.callbackResponse': {
                monitor.widgetCallbackReturned(data);
                onCallbackResponse({ data });
                break;
              }
              case 'widget.render': {
                monitor.widgetRendered(data);
                onRender({
                  data,
                  isDebug: showWidgetDebug,
                  markWidgetUpdated: (update: WidgetUpdate) => monitor.widgetUpdated(update),
                  mountElement,
                  widgetSourceBaseUrl: LOCAL_PROXY_WIDGET_URL_PREFIX,
                  widgets: widgetProxy,
                });
                break;
              }
              default:
                break;
          }
        } catch (e) {
          console.error({ event }, e);
        }
      };
    }

    const messageListeners = [
      buildMessageListener('transpiler.sourceTranspiled'),
      buildMessageListener('widget.callbackInvocation'),
      buildMessageListener('widget.callbackResponse'),
      buildMessageListener('widget.render'),
    ];

    messageListeners.forEach((cb) => window.addEventListener('message', cb));
    return () => messageListeners.forEach((cb) => window.removeEventListener('message', cb));
  }, [rootWidgetSource, showWidgetDebug]);

  let rootWidgetFetching = false;
  useEffect(() => {
    if (!rootWidget || rootWidgetFetching) {
      return;
    }

    rootWidgetFetching = true;
    requestWidgetSource(rootWidget);
  }, [rootWidget]);

  return (
    <div className='App'>
      <Transpiler />
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
            <div key={0} widget-id={rootWidget}>
              {rootWidgetSource && (
                <SandboxedIframe
                  id={getIframeId(rootWidget)}
                  scriptSrc={rootWidgetSource}
                />
              )}
            </div>
            {
              Object.entries({ ...widgetProxy })
                .filter(([, { widgetComponent }]) => !!widgetComponent)
                .map(([widgetId, { props, widgetComponent }]) => (
                  <div key={widgetId} widget-id={widgetId}>
                    <SandboxedIframe
                      id={getIframeId(widgetId)}
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
