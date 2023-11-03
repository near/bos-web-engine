import type { ComponentTrust } from '@bos-web-engine/common';
import { VNode } from 'preact';

export interface WebEngineMeta {
  componentId?: string;
  isProxy?: boolean;
  parentMeta?: WebEngineMeta;
}

export type BuildRequestCallback = () => CallbackRequest;

export interface CallbackRequest {
  promise: Promise<any>;
  rejecter?: (reason: any) => void;
  resolver?: (value: any) => void;
}

export type RequestMap = { [key: string]: CallbackRequest };
export type CallbackMap = { [key: string]: Function };

export type DeserializePropsCallback = (params: DeserializePropsParams) => any;
export interface DeserializePropsParams {
  componentId: string;
  props: SerializedProps;
}

export type EventArgs = { event: any };

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

export interface InvokeCallbackParams {
  args: SerializedArgs | EventArgs;
  callback: Function;
}

export interface InvokeComponentCallbackParams {
  args: SerializedArgs;
  buildRequest: BuildRequestCallback;
  callbacks: CallbackMap;
  componentId: string;
  invokeCallback: (args: InvokeCallbackParams) => any;
  method: string;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  requests: { [key: string]: CallbackRequest };
  serializeArgs: SerializeArgsCallback;
  targetId: string;
}

export interface KeyValuePair {
  [key: string]: any;
}

export interface Props extends KeyValuePair {
  __bweMeta?: WebEngineMeta;
  __domcallbacks?: { [key: string]: any };
  __componentcallbacks?: { [key: string]: any };
  children?: any[];
  className?: string;
  id?: string;
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

export interface PostMessageEvent {
  data: MessagePayload;
}

export interface PostMessageParams {
  type: EventType;
}

export type PostMessageCallback = <T extends PostMessageParams>(
  message: T
) => void;

export type PostMessageComponentInvocationCallback = (
  message: PostMessageComponentCallbackInvocationParams
) => void;
export interface ComponentCallbackInvocation extends PostMessageParams {
  args: SerializedArgs;
  method: string;
  originator: string;
  requestId: string;
  targetId: string;
  type: ComponentCallbackInvocationType;
}

export interface PostMessageComponentCallbackInvocationParams {
  args: any[];
  callbacks: CallbackMap;
  method: string;
  postMessage: PostMessageCallback;
  requestId: string;
  serializeArgs: SerializeArgsCallback;
  targetId: string;
  componentId: string;
}

export type PostMessageComponentResponseCallback = (
  message: PostMessageComponentCallbackResponseParams
) => void;
export interface ComponentCallbackResponse extends PostMessageParams {
  componentId: string;
  requestId: string;
  result: string; // stringified JSON in the form of { result: any, error: string }
  targetId: string;
  type: ComponentCallbackResponseType;
}
export interface PostMessageComponentCallbackResponseParams {
  componentId: string;
  error: Error | null;
  postMessage: PostMessageCallback;
  requestId: string;
  result: any;
  targetId: string;
}

export interface ComponentRender extends PostMessageParams {
  childComponents: ComponentChildMetadata[];
  componentId: string;
  node: SerializedNode;
  trust: ComponentTrust;
  type: ComponentRenderType;
}
export interface PostMessageComponentRenderParams {
  childComponents: ComponentChildMetadata[];
  componentId: string;
  node: SerializedNode;
  postMessage: PostMessageCallback;
  trust: ComponentTrust;
}

export interface ComponentUpdate extends PostMessageParams {
  props: any;
  type: ComponentUpdateType;
  componentId: string;
}

export type IsMatchingPropsCallback = (a: Props, b: Props) => boolean;

interface PreactifyParams {
  node: Node;
  Component: Function;
  createElement: PreactCreateElement;
}

export type PreactifyCallback = (params: PreactifyParams) => any;

export interface ComposeSerializationMethodsParams {
  buildRequest: BuildRequestCallback;
  callbacks: CallbackMap;
  parentContainerId: string | null;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  preactRootComponentName: string;
  postMessage: PostMessageCallback;
  requests: RequestMap;
}

export type ComposeSerializationMethodsCallback = (
  params: ComposeSerializationMethodsParams
) => {
  deserializeProps: DeserializePropsCallback;
  serializeArgs: SerializeArgsCallback;
  serializeNode: SerializeNodeCallback;
  serializeProps: SerializePropsCallback;
};

export type UpdateContainerPropsCallback = (props: Props) => void;

export interface ProcessEventParams {
  buildRequest: BuildRequestCallback;
  callbacks: CallbackMap;
  componentId: string;
  deserializeProps: DeserializePropsCallback;
  invokeCallback: (args: InvokeCallbackParams) => any;
  invokeComponentCallback: (args: InvokeComponentCallbackParams) => any;
  parentContainerId: string | null;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  postCallbackResponseMessage: PostMessageComponentResponseCallback;
  postMessage: PostMessageCallback;
  renderDom: (node: any) => object;
  requests: RequestMap;
  serializeArgs: SerializeArgsCallback;
  serializeNode: SerializeNodeCallback;
  updateProps: (props: Props) => void;
}

export interface InitContainerParams {
  containerMethods: {
    buildEventHandler: (params: ProcessEventParams) => Function;
    buildRequest: BuildRequestCallback;
    buildSafeProxy: BuildSafeProxyCallback;
    buildUseComponentCallback: BuildUseComponentCallback;
    composeSerializationMethods: ComposeSerializationMethodsCallback;
    dispatchRenderEvent: DispatchRenderEventCallback;
    invokeCallback: (args: InvokeCallbackParams) => any;
    invokeComponentCallback: (args: InvokeComponentCallbackParams) => any;
    isMatchingProps: IsMatchingPropsCallback;
    postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
    postCallbackResponseMessage: PostMessageComponentResponseCallback;
    postComponentRenderMessage: (p: any) => void;
    postMessage: PostMessageCallback;
    preactify: PreactifyCallback;
    renderContainerComponent: RenderContainerComponentCallback;
  };
  context: {
    Component: Function;
    componentId: string;
    componentPropsJson: object;
    ContainerComponent: Function;
    createElement: PreactCreateElement;
    parentContainerId: string | null;
    preactHooksDiffed: (node: VNode) => void;
    preactRootComponentName: string;
    props: any;
    render: PreactRender;
    trust: string;
    updateContainerProps: UpdateContainerPropsCallback;
  };
}

export type SerializedArgs = Array<
  string | number | object | any[] | { __componentMethod: string }
>;
export type SerializeArgsCallback = (
  args: SerializeArgsParams
) => SerializedArgs;
export interface SerializeArgsParams {
  args: any[];
  callbacks: CallbackMap;
  componentId: string;
}

export interface PreactElement {
  type: string;
  props: any;
}

export type PreactCreateElement = (
  type: string | Function,
  props: any,
  children: any
) => PreactElement;

export type PreactRender = (component: Function, target: HTMLElement) => void;

export interface Node {
  type: string | Function;
  props?: Props;
  key?: string;
}

interface ComponentChildMetadata {
  componentId: string;
  props: Props;
  source: string;
  trust: ComponentTrust;
}

export interface SerializeNodeParams {
  node: Node;
  childComponents: ComponentChildMetadata[];
  parentId: string;
}
export type SerializeNodeCallback = (
  args: SerializeNodeParams
) => SerializedNode;

export interface SerializedNode {
  childComponents?: ComponentChildMetadata[];
  className?: string;
  type: string;
  props: Props;
}

export interface SerializedProps extends KeyValuePair {
  __componentcallbacks?: {
    [key: string]: SerializedComponentCallback;
  };
}

export interface SerializePropsParams {
  componentId?: string;
  parentId: string;
  props: any;
}

export type SerializePropsCallback = (params: SerializePropsParams) => Props;

export interface SerializedComponentCallback {
  __componentMethod: string;
  parentId: string;
}

interface RenderComponentParams {
  ContainerComponent: Function;
  createElement: PreactCreateElement;
  render: Function;
  componentId: string;
}

export type RenderComponentCallback = () => void;

export type RenderContainerComponentCallback = (
  params: RenderComponentParams
) => PreactElement | undefined;

export interface DispatchRenderEventParams {
  callbacks: CallbackMap;
  componentId: string;
  node: Node;
  nodeRenders: Map<string, string>;
  postComponentRenderMessage: (p: any) => void;
  postMessage: PostMessageCallback;
  preactRootComponentName: string;
  serializeNode: (p: SerializeNodeParams) => SerializedNode;
  serializeProps: SerializePropsCallback;
  trust: string;
}
export type DispatchRenderEventCallback = (
  params: DispatchRenderEventParams
) => void;

interface BuildSafeProxyParams {
  props: Props;
  componentId: string;
}

export type BuildSafeProxyCallback = (params: BuildSafeProxyParams) => object;

export type BuildUseComponentCallback = (
  renderComponent: RenderComponentCallback
) => void;
