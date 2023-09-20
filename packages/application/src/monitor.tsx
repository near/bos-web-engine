import type { ComponentRender } from '@bos-web-engine/container';
import React from 'react';

import type {
  ComponentInstance,
  ComponentMetrics,
} from './types';

export function ComponentMonitor({ components, metrics }: { components: ComponentInstance[], metrics: ComponentMetrics }) {
  const groupedComponents = components.reduce((componentsBySource, component) => {
    const source = component.componentId?.split('##')[0] || '';
    if (!componentsBySource[source]) {
      componentsBySource[source] = [];
    }

    componentsBySource[source].push(component);
    return componentsBySource;
  }, {} as { [key: string]: ComponentInstance[] });

  const sortedByFrequency = Object.entries(groupedComponents) as [string, ComponentInstance[]][];
  sortedByFrequency.sort(([, aComponents], [, bComponents]) => bComponents.length - aComponents.length);

  return (
    <div id='component-monitor'>
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
      <div className='renders'>
        <div className='metric-section-header'>Renders</div>
        {
          metrics.componentRenders.toReversed().map((render: ComponentRender, i: number) => (
            <div key={i} className='component-render' onClick={() => console.log(render)}>
              {metrics.componentRenders.length - i}: {render.componentId}
            </div>
          ))
        }
      </div>
      <div className='components'>
        <div className='metric-section-header'>Component Containers</div>
        {
          sortedByFrequency
            .map(([source, componentsBySource], i) => (
              <div className='component-row' key={`component-row-${i}`}>
                {componentsBySource.length} {source}
              </div>
            ))
        }
      </div>
    </div>
  );
}
