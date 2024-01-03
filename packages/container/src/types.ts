import type {
  ComponentChildMetadata,
  ComponentTrust,
  Props,
  SerializedArgs,
  SerializedNode,
  SerializedProps,
} from '@bos-web-engine/common';
import { FunctionComponent, VNode } from 'preact';

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

export type PostMessageComponentInvocationCallback = (
  message: PostMessageComponentCallbackInvocationParams
) => void;

export interface PostMessageComponentCallbackInvocationParams {
  args: any[];
  callbacks: CallbackMap;
  method: string;
  requestId: string;
  serializeArgs: SerializeArgsCallback;
  targetId: string;
  componentId: string;
}

export type PostMessageComponentResponseCallback = (
  message: PostMessageComponentCallbackResponseParams
) => void;
export interface PostMessageComponentCallbackResponseParams {
  componentId: string;
  error: Error | null;
  requestId: string;
  result: any;
  targetId: string;
}

export type PostMessageComponentRenderCallback = (
  message: PostMessageComponentRenderParams
) => void;
export interface PostMessageComponentRenderParams {
  childComponents: ComponentChildMetadata[];
  componentId: string;
  node: SerializedNode;
  trust: ComponentTrust;
}

interface ComposeRenderMethodsParams {
  componentId: string;
  isComponent: (component: Function) => boolean;
  isFragment: (component: Function) => boolean;
  isRootComponent: (component: Function) => boolean;
  postComponentRenderMessage: PostMessageComponentRenderCallback;
  serializeNode: SerializeNodeCallback;
  trust: ComponentTrust;
}

export type ComposeRenderMethodsCallback = (
  params: ComposeRenderMethodsParams
) => {
  commit: (vnode: VNode) => void;
};

export interface ComposeSerializationMethodsParams {
  buildRequest: BuildRequestCallback;
  callbacks: CallbackMap;
  isComponent: (component: Function) => boolean;
  parentContainerId: string | null;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  requests: RequestMap;
}

export type ComposeSerializationMethodsCallback = (
  params: ComposeSerializationMethodsParams
) => {
  deserializeProps: DeserializePropsCallback;
  serializeArgs: SerializeArgsCallback;
  serializeNode: SerializeNodeCallback;
};

export type ComposeMessagingMethodsCallback = () => {
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  postCallbackResponseMessage: PostMessageComponentResponseCallback;
  postComponentRenderMessage: PostMessageComponentRenderCallback;
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
    composeMessagingMethods: ComposeMessagingMethodsCallback;
    composeRenderMethods: ComposeRenderMethodsCallback;
    composeSerializationMethods: ComposeSerializationMethodsCallback;
    dispatchRenderEvent: DispatchRenderEventCallback;
    invokeCallback: (args: InvokeCallbackParams) => any;
    invokeComponentCallback: (args: InvokeComponentCallbackParams) => any;
    postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
    postCallbackResponseMessage: PostMessageComponentResponseCallback;
    postComponentRenderMessage: (p: any) => void;
  };
  context: {
    BWEComponent: FunctionComponent;
    Component: Function;
    componentId: string;
    componentPropsJson: object;
    createElement: PreactCreateElement;
    Fragment: FunctionComponent;
    parentContainerId: string | null;
    props: any;
    trust: ComponentTrust;
    updateContainerProps: UpdateContainerPropsCallback;
  };
}

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

export interface Node {
  type: string | Function;
  props?: Props;
  key?: string;
}

export interface SerializeNodeParams {
  node: Node;
  childComponents: ComponentChildMetadata[];
  parentId: string;
}
export type SerializeNodeCallback = (
  args: SerializeNodeParams
) => SerializedNode;

export interface SerializePropsParams {
  componentId?: string;
  parentId: string;
  props: any;
}

export type SerializePropsCallback = (params: SerializePropsParams) => Props;

export interface DispatchRenderEventParams {
  callbacks: CallbackMap;
  componentId: string;
  node: Node;
  postComponentRenderMessage: PostMessageComponentRenderCallback;
  serializeNode: (p: SerializeNodeParams) => SerializedNode;
  serializeProps: SerializePropsCallback;
  trust: ComponentTrust;
}
export type DispatchRenderEventCallback = (
  params: DispatchRenderEventParams
) => void;

interface BuildSafeProxyParams {
  props: Props;
  componentId: string;
}

export type BuildSafeProxyCallback = (params: BuildSafeProxyParams) => object;
