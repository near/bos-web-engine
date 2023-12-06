import { getIframeId } from '@bos-web-engine/iframe';

import type {
  DeserializePropsParams,
  IframePostMessageParams,
  SendMessageParams,
} from './types';

function postMessageToIframe({
  id,
  message,
  targetOrigin,
}: IframePostMessageParams): void {
  const iframe = document.getElementById(id) as HTMLIFrameElement;
  if (!iframe) {
    console.error(`failed to send message to invalid iframe ${id}`, message);
    return;
  }

  iframe.contentWindow?.postMessage(message, targetOrigin);
}

export function sendMessage({
  componentId,
  message,
  onMessageSent,
}: SendMessageParams): void {
  onMessageSent({ toComponent: componentId, message });
  postMessageToIframe({
    id: getIframeId(componentId),
    message,
    targetOrigin: '*',
  });
}

export function deserializeProps({
  id,
  props,
  onMessageSent,
}: DeserializePropsParams): any {
  if (!props) {
    return props;
  }

  delete props.__bweMeta;
  if (!props.__domcallbacks) {
    return props;
  }

  Object.entries(props.__domcallbacks).forEach(
    ([propKey, callback]: [string, any]) => {
      props[propKey.split('::')[0]] = (...args: any[]) => {
        let serializedArgs: any = args;
        const event = args[0] || {};

        // TODO make this opt-in/out?
        event?.preventDefault();

        const { target } = event;
        // is this a DOM event?
        if (target && typeof target === 'object') {
          const { checked, name, type, value } = target;
          serializedArgs = {
            event: {
              target: {
                checked,
                name,
                type,
                value,
              },
            },
          };
        }

        sendMessage({
          componentId: id,
          message: {
            args: serializedArgs,
            method: callback.__componentMethod,
            type: 'component.domCallback',
          },
          onMessageSent,
        });
      };
    }
  );

  delete props.__domcallbacks;
  delete props.__componentcallbacks;

  return props;
}
