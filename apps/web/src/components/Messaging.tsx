import { BWEMessage } from '@bos-web-engine/application';
import type { MessagePayload } from '@bos-web-engine/common';
import { useState } from 'react';
import { JSONTree } from 'react-json-tree';

import s from './Messaging.module.css';

interface ComponentId {
  author: string;
  name: string;
  path: string;
  id: string;
  parent: ComponentId | null;
}

interface ComponentMessage {
  isFromComponent: boolean;
  name: string;
  componentId?: ComponentId;
  message: MessagePayload;
  summary: string;
}

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

  return `${componentId.name.split('.').slice(1).join('.')}#${componentId.id}`;
};

const buildMessageSummary = (params: BWEMessage): ComponentMessage | null => {
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
        name: 'update',
        componentId: parseComponentId(toComponent!)!,
        summary: `updated props ${JSON.stringify(message.props || {})} on`,
      };
    }
    case 'component.domCallback': {
      return {
        message,
        isFromComponent,
        name: 'DOM',
        componentId: parseComponentId(toComponent!)!,
        summary: `invoked message DOM handler [${
          message.method.split('::')[0]
        }()] on`,
      };
    }
    default:
      return null;
  }
};

export function Messaging({
  containerMessages,
}: {
  containerMessages: BWEMessage[];
}) {
  const [selectedMessage, setSelectedMessage] = useState<object | null>(null);

  const reversedMessages = [...containerMessages];
  reversedMessages.reverse();

  return (
    <div className={s.panel}>
      <div className={s.messages}>
        {reversedMessages.map(buildMessageSummary).map(
          (message: ComponentMessage | null, i) =>
            message && (
              <div
                key={i}
                className={`${s.messageRow} ${
                  message.message === selectedMessage ? s.selectedMessage : ''
                }`}
                onClick={() => setSelectedMessage(message.message)}
              >
                <div className={s.messageIndex}>
                  {reversedMessages.length - i}
                </div>
                <div className={s.messageName}>
                  <div className={s.nameValue}>{message.name}</div>
                </div>
                <div className={s.messageSource}>
                  {!message.isFromComponent && 'Application'}
                  {message.isFromComponent &&
                    message.componentId &&
                    formatComponentId(message.componentId)}
                </div>
                <div className={s.messageTarget}>
                  {!message.isFromComponent &&
                    message.componentId &&
                    formatComponentId(message.componentId)}
                </div>
              </div>
            )
        )}
      </div>
      <div className={s.codePanel}>
        {selectedMessage && <JSONTree data={selectedMessage} />}
      </div>
    </div>
  );
}
