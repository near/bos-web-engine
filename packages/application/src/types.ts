import type {
  CallbackInvocationEventData,
  CallbackResponseEventData,
  EventData,
  RenderEventData,
} from '@bos-web-engine/container';
import type { DOMElement } from 'react';

export interface DomCallback {
  args: { event: any };
  method: string;
  type: string;
}

export interface WidgetUpdate {
  props: any;
  widgetId: string;
}

export interface Widget {
  parentId: string;
  props: any;
  source: string;
}

export interface CallbackInvocationHandlerOptions {
  data: CallbackInvocationEventData;
}

export interface CallbackResponseHandlerOptions {
  data: CallbackResponseEventData;
}

interface LoadComponentParams {
  componentId: string;
  componentPath: string;
  isTrusted: boolean;
  parentId: string;
  props: any;
}

export interface RenderHandlerOptions {
  data: RenderEventData;
  isDebug?: boolean;
  markWidgetUpdated: (update: WidgetUpdate) => void;
  mountElement: ({ widgetId, element }: { widgetId: string, element: any }) => void;
  isComponentLoaded(componentId: string): boolean;
  loadComponent(component: LoadComponentParams): void;
}

export interface IframePostMessageOptions {
  id: string;
  message: EventData;
  targetOrigin: string;
}

export interface DeserializePropsOptions {
  id: string;
  props: any;
}

export interface WidgetDOMElement extends DOMElement<any, any> {}

export interface CreateElementOptions {
  children?: any;
  id: string;
  props: object;
  type: string;
}

export interface CreateChildElementOptions {
  children?: any;
  depth: number;
  index?: number;
  parentId: string;
}
