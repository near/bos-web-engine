import type {
  ComponentCallbackInvocation,
  ComponentCallbackResponse,
  ComponentRender,
  ComponentTrust,
  MessagePayload,
} from '@bos-web-engine/common';
import type {
  CompilerSetLocalComponentAction,
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
  mountElement: ({
    componentId,
    element,
  }: {
    componentId: string;
    element: any;
  }) => void;
  isComponentLoaded(componentId: string): boolean;
  loadComponent(component: ComponentInstance): void;
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

export interface UseWebEngineParams {
  config: WebEngineConfiguration;
  localComponents?: WebEngineLocalComponents;
  rootComponentPath?: string;
}

export type WebEngineLocalComponents =
  CompilerSetLocalComponentAction['components'];

export interface WebEngineHooks {
  containerSourceCompiled?: (response: ComponentCompilerResponse) => void;
  messageReceived?: (message: BWEMessage) => void;
}

export interface WebEngineConfiguration {
  flags?: WebEngineFlags;
  hooks?: WebEngineHooks;
  preactVersion: string;
}

export interface WebEngineFlags {
  bosLoaderUrl?: string;
}
