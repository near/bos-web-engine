import type {
  BWEMessage,
  ComponentInstance,
  ComponentMetrics,
} from '@bos-web-engine/application';
import type { EventType, MessagePayload } from '@bos-web-engine/common';

interface ComponentId {
  author: string;
  name: string;
  path: string;
  id: string;
  parent: ComponentId | null;
}

interface ComponentMessage {
  badgeClass: string;
  isFromComponent: boolean;
  name: string;
  componentId?: ComponentId;
  message: MessagePayload;
  summary: string;
}

export function ComponentMonitor({
  components,
  metrics,
}: {
  components: ComponentInstance[];
  metrics: ComponentMetrics;
}) {
  const groupedComponents = components.reduce(
    (componentsBySource, component) => {
      const source = component.componentId?.split('##')[0] || '';
      if (!componentsBySource[source]) {
        componentsBySource[source] = [];
      }

      componentsBySource[source].push(component);
      return componentsBySource;
    },
    {} as { [key: string]: ComponentInstance[] }
  );

  const sortedByFrequency = Object.entries(groupedComponents) as [
    string,
    ComponentInstance[],
  ][];
  sortedByFrequency.sort(
    ([, aComponents], [, bComponents]) =>
      bComponents.length - aComponents.length
  );

  const reversedEvents = [...metrics.messages];
  reversedEvents.reverse();

  const messageMetrics = metrics.messages.reduce((grouped, bweMessage) => {
    const { message } = bweMessage;
    if (!message) {
      return grouped;
    }

    if (!grouped.has(message.type)) {
      grouped.set(message.type, []);
    }

    grouped.set(message.type, [...grouped.get(message.type)!, bweMessage]);
    return grouped;
  }, new Map<EventType, BWEMessage[]>());

  const displayMetrics = {
    'Containers Loaded': metrics.componentsLoaded.length,
    'Component Renders': messageMetrics.get('component.render')?.length || 0,
    'Updates Requested': messageMetrics.get('component.update')?.length || 0,
    'DOM Handlers Invoked':
      messageMetrics.get('component.domCallback')?.length || 0,
    'Callbacks Invoked':
      messageMetrics.get('component.callbackInvocation')?.length || 0,
    'Callbacks Returned':
      messageMetrics.get('component.callbackResponse')?.length || 0,
  };

  const parseComponentId = (componentId: string): ComponentId | null => {
    if (!componentId) {
      return null;
    }

    const [path, id, , ...ancestors] = componentId.split('##');
    const [author, name] = path.split('/');
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
      const formatted = Object.entries(props)
        .map(([k, v]) => `${k}=${formatProps(v)}`)
        .join(', ');
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

  const buildEventSummary = (params: BWEMessage): ComponentMessage | null => {
    const { toComponent, fromComponent, message } = params;
    const isFromComponent = fromComponent !== undefined;
    switch (message.type) {
      case 'component.render': {
        const { type, props } = message.node;
        const formattedChildren = message.childComponents?.length
          ? `with children ${message.childComponents
              .map(({ componentId }) =>
                formatComponentId(parseComponentId(componentId))
              )
              .join(', ')}`
          : '';

        return {
          message,
          isFromComponent,
          badgeClass: 'bg-danger',
          name: 'render',
          componentId: parseComponentId(message.componentId)!,
          summary: `rendered <${type} ${formatProps(props, true).slice(
            0,
            64
          )}...> ${formattedChildren}`,
        };
      }
      case 'component.callbackInvocation': {
        const targetComponent = formatComponentId(
          parseComponentId(message.targetId || '')
        );
        const { requestId, method, args } = message;
        return {
          message,
          isFromComponent,
          badgeClass: 'bg-primary',
          name: 'invoke',
          componentId: parseComponentId(message.originator)!,
          summary: `[${requestId.split('-')[0]}] called ${targetComponent}.${
            method.split('::')[0]
          }(${args})${!isFromComponent ? ' for' : ''}`,
        };
      }
      case 'component.callbackResponse': {
        const { requestId, result } = message;
        return {
          message,
          isFromComponent,
          badgeClass: 'bg-success',
          name: 'return',
          componentId: parseComponentId(
            isFromComponent ? message.containerId : message.targetId
          )!,
          summary: `[${requestId.split('-')[0]}] returned ${result} ${
            !isFromComponent ? 'to' : ''
          }`,
        };
      }
      case 'component.update': {
        return {
          message,
          isFromComponent,
          badgeClass: 'bg-warning',
          name: 'update',
          componentId: parseComponentId(toComponent!)!,
          summary: `updated props ${JSON.stringify(message.props || {})} on`,
        };
      }
      case 'component.domCallback': {
        return {
          message,
          isFromComponent,
          badgeClass: 'bg-info',
          name: 'DOM',
          componentId: parseComponentId(toComponent!)!,
          summary: `invoked event DOM handler [${
            message.method.split('::')[0]
          }()] on`,
        };
      }
      default:
        return null;
    }
  };

  return (
    <div id="component-monitor">
      <div className="metrics-dashboard-row">
        <div className="metrics metric-section-header">Stats</div>
        <div className="components metric-section-header">Containers</div>
        <div className="messages metric-section-header">Messages</div>
      </div>
      <div className="metrics-dashboard-row metrics-dashboard-data">
        <div className="metrics metrics-data">
          {Object.entries(displayMetrics).map(([label, value], i) => (
            <div className="metrics-data-point" key={`data-point-${i}`}>
              <div className="data-point-header">{label}</div>
              <div className="data-point-value">{value}</div>
            </div>
          ))}
        </div>
        <div className="components components-data">
          {sortedByFrequency.map(([source, componentsBySource], i) => (
            <div className="metrics-data-point" key={`component-row-${i}`}>
              <div className="data-point-header">{source}</div>
              <div className="data-point-value">
                {componentsBySource.length}
              </div>
            </div>
          ))}
        </div>
        <div className="messages messages-data">
          {reversedEvents.map(buildEventSummary).map(
            (event: ComponentMessage | null, i) =>
              event && (
                <div
                  key={i}
                  className="event"
                  onClick={() => console.log(event.message)}
                >
                  <span className="message-index">
                    {reversedEvents.length - i}|
                  </span>
                  <span
                    className={`badge ${event.badgeClass} message-type-badge`}
                  >
                    {event.name}
                  </span>
                  {!event.isFromComponent && (
                    <span className="message-source message-source-application">
                      Application
                    </span>
                  )}
                  {event.isFromComponent && event.componentId && (
                    <span className="message-source message-source-component">
                      {formatComponentId(event.componentId)}
                    </span>
                  )}
                  &nbsp;{event.summary}&nbsp;
                  {!event.isFromComponent && event.componentId && (
                    <span className="message-source message-source-component">
                      {formatComponentId(event.componentId)}
                    </span>
                  )}
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}
