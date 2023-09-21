import type {
  ComponentCallbackInvocation,
  ComponentCallbackResponse,
  ComponentEventData,
  ComponentRender,
  ComponentUpdate,
  DomCallback,
  EventData,
} from '@bos-web-engine/container';
import type { DOMElement } from 'react';

export interface UpdatedComponent {
  props: any;
  componentId: string;
}

export interface CallbackInvocationHandlerParams {
  data: ComponentCallbackInvocation;
}

export interface CallbackResponseHandlerParams {
  data: ComponentCallbackResponse;
}

export interface ComponentInstance {
  componentId: string;
  componentPath: string;
  isTrusted: boolean;
  parentId: string;
  props: any;
  renderCount: number;
}

export interface ComponentMetrics {
  componentsLoaded: string[];
  events: ComponentEventData[];
  missingComponents: string[];
}

export interface RenderHandlerParams {
  data: ComponentRender;
  isDebug?: boolean;
  getComponentRenderCount: (componentId: string) => number;
  componentUpdated: (update: ComponentUpdate) => void;
  mountElement: ({ componentId, element }: { componentId: string, element: any }) => void;
  isComponentLoaded(componentId: string): boolean;
  loadComponent(component: ComponentInstance): void;
  onDomCallback: OnDomCallback;
}

export interface IframePostMessageParams {
  id: string;
  message: EventData;
  targetOrigin: string;
}

type OnDomCallback = (domCallback: DomCallback) => void;

export interface DeserializePropsParams {
  id: string;
  props: any;
  onDomCallback?: OnDomCallback;
}

export interface ComponentDOMElement extends DOMElement<any, any> {}

export interface CreateElementParams {
  children?: any;
  id: string;
  props: object;
  type: string;
  onDomCallback?: OnDomCallback;
}

export interface CreateChildElementParams {
  children?: any;
  depth: number;
  index?: number;
  parentId: string;
  onDomCallback?: OnDomCallback;
}
