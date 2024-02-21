import type {
  DeserializePropsParams,
  IframePostMessageParams,
  SendMessageParams,
} from './types';

export function getAppDomId(id: string) {
  return `dom-${id}`;
}

export function getIframeId(id: string) {
  return `iframe-${id}`;
}

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

  return Object.fromEntries(
    Object.entries(props).map(([k, v]) => {
      const callbackMeta = v as { callbackIdentifier: string } | any;
      if (!callbackMeta?.callbackIdentifier) {
        return [k, v];
      }

      const { callbackIdentifier } = callbackMeta;
      return [
        k,
        (...args: any[]) => {
          let serializedArgs: any = args;
          const event = args[0] || {};

          // TODO make this opt-in/out?
          event.preventDefault?.();

          const { target } = event; // is this a DOM event?
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
              method: callbackIdentifier,
              type: 'component.domCallback',
            },
            onMessageSent,
          });
        },
      ];
    })
  );
}
