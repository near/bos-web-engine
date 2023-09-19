import { getIframeId } from '@bos-web-engine/iframe';

import type {
  DeserializePropsParams,
  IframePostMessageParams,
} from './types';

function postMessageToIframe({ id, message, targetOrigin }: IframePostMessageParams): void {
  (document.getElementById(id) as HTMLIFrameElement)
    ?.contentWindow?.postMessage(message, targetOrigin);
}

export function postMessageToComponentIframe({ id, message, targetOrigin }: IframePostMessageParams): void {
  postMessageToIframe({ id: getIframeId(id), message, targetOrigin });
}

export function deserializeProps({ id, props }: DeserializePropsParams): any {
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

        postMessageToComponentIframe({
          id,
          message: {
            args: serializedArgs,
            method: callback.__componentMethod,
            type: 'component.domCallback',
          },
          targetOrigin: '*',
        });
      };
    });

  delete props.__domcallbacks;
  delete props.__componentcallbacks;

  return props;
}
