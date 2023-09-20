import { ComponentCompiler, ComponentCompilerRequest } from '@bos-web-engine/compiler';

const compiler = new ComponentCompiler({ sendMessage: (message: any) => self.postMessage(message) });

self.onmessage = ({ data: compileRequest } : MessageEvent<ComponentCompilerRequest>) => {
  compiler.compileComponent(compileRequest)
    .catch((e) => {
      console.error(`Failed to compile component ${compileRequest.componentId}`, e);
      self.postMessage({ error: e });
    });
};

export {};
