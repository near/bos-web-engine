import { getWidgetSource } from '@bos-web-engine/transpiler';

self.onmessage = (event: MessageEvent) => {
  const { isTrusted, source } = event.data;
  getWidgetSource({
    widgetId: source,
    isTrusted,
    sendMessage: (message: any) => self.postMessage(message),
  })
    .catch((e: Error) => {
      console.error(`Failed to fetch Component source for ${source} (${isTrusted ? 'trusted' : 'sandboxed' })`, e);
    });
};

export {};
