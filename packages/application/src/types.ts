import type {
  CallbackInvocationEventData,
  CallbackResponseEventData,
  ComponentEventData,
  ComponentUpdate,
  EventData,
  RenderEventData,
} from '@bos-web-engine/container';
import type { DOMElement } from 'react';

export interface DomCallback {
  args: { event: any };
  method: string;
  type: string;
}

export interface UpdatedComponent {
  props: any;
  componentId: string;
}

export interface CallbackInvocationHandlerParams {
  data: CallbackInvocationEventData;
}

export interface CallbackResponseHandlerParams {
  data: CallbackResponseEventData;
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
  data: RenderEventData;
  isDebug?: boolean;
  getComponentRenderCount: (componentId: string) => number;
  componentUpdated: (update: ComponentUpdate) => void;
  mountElement: ({ componentId, element }: { componentId: string, element: any }) => void;
  isComponentLoaded(componentId: string): boolean;
  loadComponent(component: ComponentInstance): void;
}

export interface IframePostMessageParams {
  id: string;
  message: EventData;
  targetOrigin: string;
}

export interface DeserializePropsParams {
  id: string;
  props: any;
}

export interface ComponentDOMElement extends DOMElement<any, any> {}

export interface CreateElementParams {
  children?: any;
  id: string;
  props: object;
  type: string;
}

export interface CreateChildElementParams {
  children?: any;
  depth: number;
  index?: number;
  parentId: string;
}
