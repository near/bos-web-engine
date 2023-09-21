import type { ComponentEventData } from '@bos-web-engine/container';
import React from 'react';

import type {
  ComponentInstance,
  ComponentMetrics,
} from './types';

interface ComponentId {
  author: string;
  name: string;
  path: string;
  id: string;
  parent: ComponentId | null;
}

interface ComponentEvent {
  badgeClass: string;
  name: string;
  componentId?: ComponentId;
  event: ComponentEventData;
  message: string,
}

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

  const reversedEvents = [...metrics.events];
  reversedEvents.reverse();

  const displayMetrics = {
    'Component Containers Loaded': metrics.componentsLoaded.length,
    'Component Renders': metrics.events.filter(({ type }) => type === 'component.render').length,
    'Component Updates Requested': metrics.events.filter(({ type }) => type === 'component.update').length,
    'DOM Event Handlers Invoked': metrics.events.filter(({ type }) => type === 'component.domCallback').length,
    'Callbacks Invoked': metrics.events.filter(({ type }) => type === 'component.callbackInvocation').length,
    'Callbacks Returned': metrics.events.filter(({ type }) => type === 'component.callbackResponse').length,
    'Missing Components': metrics.missingComponents.length,
  };

  const parseComponentId = (componentId: string): ComponentId | null => {
    if (!componentId) {
      return null;
    }

    const [path, id, , ...ancestors] = componentId.split('##');
    const [author, , name] = path.split('/');
    return {
      author,
      name,
      path,
      id,
      parent: parseComponentId(ancestors.join('##')),
    };
  };

  const formatProps = (props: any, isRoot = false): any => {
    if (!props || typeof props === 'number') {
      return props;
    }

    if (Array.isArray(props)) {
      return `[${props.map((p) => formatProps(p)).join(', ')}]`;
    }

    if (typeof props === 'object') {
      const formatted = Object.entries(props).map(([k, v]) => `${k}=${formatProps(v)}`).join(', ');
      if (isRoot) {
        return formatted;
      }

      return `{ ${formatted} }`;
    }

    return `"${props.toString()}"`;
  };

  const formatComponentId = (componentId: ComponentId | null) => {
    if (!componentId) {
      return '';
    }

    if (!componentId.id) {
      return componentId.name;
    }

    return `${componentId.name}#${componentId.id}`;
  };

  const buildEventSummary = (event: ComponentEventData): ComponentEvent | null => {
    switch (event.type) {
      case 'component.render': {
        const { type, props } = event.node;
        const formattedChildren = event.childComponents.length
          ? `with children ${event.childComponents.map(({ componentId }) => formatComponentId(parseComponentId(componentId))).join(', ')}`
          : '';

        return {
          event,
          badgeClass: 'bg-danger',
          name: 'render',
          componentId: parseComponentId(event.componentId)!,
          message: `rendered <${type} ${formatProps(props, true).slice(0, 64)}...> ${formattedChildren}`,
        };
      }
      case 'component.callbackInvocation': {
        const targetComponent = formatComponentId(parseComponentId(event.targetId));
        const { requestId, method, args } = event;
        return {
          event,
          badgeClass: 'bg-primary',
          name: 'invoke',
          componentId: parseComponentId(event.originator)!,
          message: `[${requestId.split('-')[0]}] called ${method.split('::')[0]}(${args}) on ${targetComponent}`,
        };
      }
      case 'component.callbackResponse': {
        const { requestId, result } = event;
        return {
          event,
          badgeClass: 'bg-success',
          name: 'return',
          componentId: parseComponentId(event.componentId)!,
          message: `[${requestId.split('-')[0]}] returned ${result} to ${formatComponentId(parseComponentId(event.targetId))}`,
        };
      }
      case 'component.update': {
        const { __componentcallbacks, ...simpleProps } = event.props || {};
        return {
          event,
          badgeClass: 'bg-warning',
          name: 'update',
          componentId: parseComponentId(event.componentId)!,
          message: `updated props ${JSON.stringify(simpleProps)}`,
        };
      }
      case 'component.domCallback': {
        return {
          event,
          badgeClass: 'bg-info',
          name: 'DOM',
          componentId: parseComponentId(event.componentId!)!,
          message: `${event.method.split('::')[0]}() invoked from event DOM handler`,
        };
      }
      default:
        return null;
    }
  };

  return (
    <div id='component-monitor'>
      <div className='metrics'>
        {Object.entries(displayMetrics).map(([label, value], i) => (
          <div className='metrics-data-point' key={`data-point-${i}`}>
            <div className='data-point-header'>{label}</div>
            <div className='data-point-value'>{value}</div>
          </div>
        ))}
      </div>
      <div className='events'>
        <div className='metric-section-header'>Events</div>
        {
          reversedEvents
            .map(buildEventSummary)
            .map((event: ComponentEvent | null, i) => event && (
              <div key={i} className='event' onClick={() => console.log(event.event)}>
                <span className={`badge ${event.badgeClass} event-type-badge`}>
                  {event.name}
                </span>
                {event.componentId && (
                  <span className='event-source-component'>
                    {formatComponentId(event.componentId)}
                  </span>
                )}
                &nbsp;{event.message}
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
