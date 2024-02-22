import type { InvokeApplicationCallbackParams } from './invocation';

export interface WebEngineContext {
  callApplicationMethod<T>(params: InvokeApplicationCallbackParams): Promise<T>;
}

export type InitPluginCallback<T> = (context: WebEngineContext) => T;

export interface WebEngine {
  initPlugin<T>(init: InitPluginCallback<T>): T;
}
