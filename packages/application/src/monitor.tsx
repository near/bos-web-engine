import React from 'react';

import type {
  Widget,
} from './types';

export function ComponentMonitor({ components, metrics }: { components: any[], metrics: object }) {
  const groupedComponents = components.reduce((componentsBySource, widget) => {
    const source = widget.componentId.split('##')[0];
    if (!componentsBySource[source]) {
      componentsBySource[source] = [];
    }

    componentsBySource[source].push(widget);
    return componentsBySource;
  }, {} as { [key: string]: Widget[] });
  const sortedByFrequency = Object.entries(groupedComponents) as [string, Widget[]][];
  sortedByFrequency.sort(([, aComponents], [, bComponents]) => bComponents.length - aComponents.length);

  return (
    <div id='widget-monitor'>
      <div className='metrics'>
        {Object.entries(metrics).map(([label, value], i) => (
          <div className='metrics-data-point' key={`data-point-${i}`}>
            <div className='data-point-header'>{label}</div>
            <div className='data-point-value'>
              {value.length}
            </div>
          </div>
        ))}
      </div>
      <div className='widgets'>
        {
          sortedByFrequency
            .map(([source, componentsBySource], i) => (
              <div className='widget-row' key={`widget-row-${i}`}>
                {(componentsBySource as Widget[]).length} {source}
              </div>
            ))
        }
      </div>
    </div>
  );
}
