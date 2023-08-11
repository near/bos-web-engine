import type {
  PostMessageWidgetCallbackInvocation,
  PostMessageWidgetCallbackResponse,
  PostMessageWidgetRender,
} from '@bos-web-engine/container';
import React from 'react';

import type {
  DomCallback,
  Widget,
  WidgetUpdate,
} from './types';

export class WidgetActivityMonitor {
  callbacks: {
    invocations: PostMessageWidgetCallbackInvocation[],
    responses: PostMessageWidgetCallbackResponse[],
  } = { invocations: [], responses: [] };
  domCallbacks: DomCallback[] = [];
  renders: PostMessageWidgetRender[] = [];
  updates: WidgetUpdate[] = [];
  widgets: Widget[] = [];
  missingWidgets: string[] = [];

  domCallbackInvoked(callback: DomCallback) {
    this.domCallbacks.push(callback);
  }

  missingWidgetReferenced(widgetId: string) {
    this.missingWidgets.push(widgetId);
  }

  widgetAdded(widget: Widget) {
    this.widgets.push(widget);
  }

  widgetCallbackInvoked(invocation: PostMessageWidgetCallbackInvocation) {
    this.callbacks.invocations.push(invocation);
  }

  widgetCallbackReturned(response: PostMessageWidgetCallbackResponse) {
    this.callbacks.responses.push(response);
  }

  widgetRendered(render: PostMessageWidgetRender) {
    this.renders.push(render);
  }

  widgetUpdated(update: WidgetUpdate) {
    this.updates.push(update);
  }
}

export function WidgetMonitor({ monitor }: { monitor: WidgetActivityMonitor }) {
  const dataPoints = [
    { label: 'widgets loaded', value: monitor.widgets.length },
    { label: 'renders', value: monitor.renders.length },
    { label: 'updates', value: monitor.updates.length },
    { label: 'invocations', value: monitor.callbacks.invocations.length },
    { label: 'responses', value: monitor.callbacks.responses.length },
    { label: 'missing widgets', value: monitor.missingWidgets.length },
  ];

  return (
    <div id='widget-monitor'>
      <div className='metrics'>
        {dataPoints.map(({ label, value }, i) => (
          <div className='metrics-data-point' key={`data-point-${i}`}>
            <div className='data-point-header'>{label}</div>
            <div className='data-point-value'>
              {value}
            </div>
          </div>
        ))}
      </div>
      <div className='widgets'>
        {
          Object.entries(monitor.widgets.reduce((widgetsBySource, widget) => {
            const { source } = widget;
            if (!widgetsBySource[source]) {
              widgetsBySource[source] = [];
            }

            widgetsBySource[source].push(widget);
            return widgetsBySource;
          }, {} as { [key: string]: Widget[] }))
            .sort(([, aWidgets], [, bWidgets]) => bWidgets.length - aWidgets.length)
            .map(([source, widgets], i) => (
              <div className='widget-row' key={`widget-row-${i}`}>
                {widgets.length} {source}
              </div>
            ))
        }
      </div>
    </div>
  );
}
