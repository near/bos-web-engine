import type {
  ComponentChildMetadata,
  SerializedArgs,
  SerializedNode,
} from './serialization';
import type { ComponentTrust } from './trust';

type ComponentCallbackInvocationType = 'component.callbackInvocation';
type ComponentCallbackResponseType = 'component.callbackResponse';
type ComponentDomCallbackType = 'component.domCallback';
type ComponentRenderType = 'component.render';
type ComponentUpdateType = 'component.update';
export type EventType =
  | ComponentCallbackInvocationType
  | ComponentCallbackResponseType
  | ComponentDomCallbackType
  | ComponentRenderType
  | ComponentUpdateType;

export interface PostMessageEvent {
  data: MessagePayload;
}

export interface PostMessageParams {
  type: EventType;
}
export interface ComponentCallbackInvocation extends PostMessageParams {
  args: SerializedArgs;
  method: string;
  originator: string;
  requestId: string;
  targetId: string;
  type: ComponentCallbackInvocationType;
}

export interface ComponentCallbackResponse extends PostMessageParams {
  containerId: string;
  requestId: string;
  result: string; // stringified JSON in the form of { result: any, error: string }
  targetId: string;
  type: ComponentCallbackResponseType;
}

export interface ComponentRender extends PostMessageParams {
  childComponents: ComponentChildMetadata[];
  componentId: string;
  node: SerializedNode;
  trust: ComponentTrust;
  type: ComponentRenderType;
}

export interface ComponentUpdate extends PostMessageParams {
  props: any;
  type: ComponentUpdateType;
  componentId: string;
}

export interface DomCallback {
  args: SerializedArgs;
  componentId?: string;
  method: string;
  type: ComponentDomCallbackType;
}

export type MessagePayload =
  | ComponentCallbackInvocation
  | ComponentCallbackResponse
  | DomCallback
  | ComponentRender
  | ComponentUpdate;
