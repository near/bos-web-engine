import type {
  ComponentCallbackInvocation,
  ComponentCallbackResponse,
  ComponentRender,
  ComponentTrust,
  MessagePayload,
} from '@bos-web-engine/common';
import type {
  ComponentCompilerRequest,
  ComponentCompilerResponse,
} from '@bos-web-engine/compiler';
import type { DOMElement } from 'react';

export interface CallbackInvocationHandlerParams {
  data: ComponentCallbackInvocation;
  onMessageSent: OnMessageSentCallback;
}

export interface CallbackResponseHandlerParams {
  data: ComponentCallbackResponse;
  onMessageSent: OnMessageSentCallback;
}

export interface ComponentInstance {
  componentId: string;
  componentPath: string;
  parentId: string;
  props: any;
  renderCount: number;
  trust: ComponentTrust;
}

export interface ComponentMetrics {
  componentsLoaded: string[];
  messages: SendMessageParams[];
}

export interface RenderHandlerParams {
  data: ComponentRender;
  debug?: WebEngineDebug;
  mountElement: ({
    componentId,
    element,
  }: {
    componentId: string;
    element: any;
  }) => void;
  isComponentLoaded(componentId: string): boolean;
  loadComponent(component: ComponentInstance): void;
  getContainerRenderCount(containerId: string): number;
  onMessageSent: OnMessageSentCallback;
}

export interface IframePostMessageParams {
  id: string;
  message: MessagePayload;
  targetOrigin: string;
}

export interface BWEMessage {
  toComponent?: string;
  fromComponent?: string;
  message: MessagePayload;
}

type OnMessageSentCallback = (params: BWEMessage) => void;

export interface SendMessageParams {
  componentId: string;
  message: MessagePayload;
  onMessageSent: OnMessageSentCallback;
}

export interface DeserializePropsParams {
  id: string;
  onMessageSent: OnMessageSentCallback;
  props: any;
}

export interface ComponentDOMElement extends DOMElement<any, any> {}

export interface CreateElementParams {
  children?: any;
  id: string;
  onMessageSent: OnMessageSentCallback;
  props: object;
  type: string;
}

export interface CreateChildElementParams {
  children?: any;
  depth: number;
  index?: number;
  onMessageSent: OnMessageSentCallback;
  parentId: string;
}

export interface CompilerWorker extends Omit<Worker, 'postMessage'> {
  postMessage(compilerRequest: ComponentCompilerRequest): void;
}

export interface UseWebEngineParams {
  compiler: CompilerWorker | null;
  config: WebEngineConfiguration;
  rootComponentPath?: string;
}

export interface UseWebEngineSandboxParams extends UseWebEngineParams {
  localComponents?: WebEngineLocalComponents;
}

export interface WebEngineDebug {
  showContainerBoundaries?: boolean;
}

export interface WebEngineHooks {
  componentRendered?: (componentId: string) => void;
  containerSourceCompiled?: (response: ComponentCompilerResponse) => void;
  messageReceived?: (message: BWEMessage) => void;
}

export interface WebEngineConfiguration {
  debug?: WebEngineDebug;
  flags?: WebEngineFlags;
  hooks?: WebEngineHooks;
  preactVersion: string;
}

export interface WebEngineFlags {
  bosLoaderUrl?: string;
}
