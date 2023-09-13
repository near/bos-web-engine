import { getIframeId } from '@bos-web-engine/iframe';

import type {
  DeserializePropsOptions,
  IframePostMessageOptions,
} from './types';

export function postMessageToIframe({ id, message, targetOrigin }: IframePostMessageOptions): void {
  (document.getElementById(id) as HTMLIFrameElement)
    ?.contentWindow?.postMessage(message, targetOrigin);
}

export function postMessageToWidgetIframe({ id, message, targetOrigin }: IframePostMessageOptions): void {
  postMessageToIframe({ id: getIframeId(id), message, targetOrigin });
}

export function deserializeProps({ id, props }: DeserializePropsOptions): any {
  if (!props) {
    return props;
  }

  delete props.__bweMeta;
  if (!props.__domcallbacks) {
    return props;
  }

  Object.entries(props.__domcallbacks)
    .forEach(([propKey, callback]: [string, any]) => {
      props[propKey.split('::')[0]] = (...args: any[]) => {
        let serializedArgs: any = args;
        // is this a DOM event?
        if (args[0]?.target) {
          serializedArgs = {
            event: {
              target: {
                value: args[0].target?.value,
              },
            },
          };
        }

        postMessageToWidgetIframe({
          id,
          message: {
            args: serializedArgs,
            method: callback.__widgetMethod,
            type: 'widget.domCallback',
          },
          targetOrigin: '*',
        });
      };
    });

  delete props.__domcallbacks;
  delete props.__widgetcallbacks;

  return props;
}
