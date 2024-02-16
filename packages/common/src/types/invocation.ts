import type { SerializedArgs } from './serialization';

export interface InvokeApplicationCallbackParams {
  args: SerializedArgs;
  method: string;
}

export interface ExternalCallbackInvocation<T> {
  invocationId: string;
  invocation: Promise<T>;
}
