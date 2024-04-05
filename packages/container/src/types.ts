import type {
  BOSComponentProps,
  ComponentChildMetadata,
  ComponentTrust,
  ExternalCallbackInvocation,
  Props,
  SerializedArgs,
  SerializedNode,
} from '@bos-web-engine/common';
import type { ComponentChildren, FunctionComponent, VNode } from 'preact';

export type BuildRequestCallback = () => CallbackRequest;

export interface CallbackRequest {
  promise: Promise<any>;
  rejecter?: (reason: any) => void;
  resolver?: (value: any) => void;
}

export type RequestMap = { [key: string]: CallbackRequest };
export type CallbackMap = { [key: string]: Function };

export type DeserializeArgsCallback = (params: DeserializeArgsParams) => any;
export interface DeserializeArgsParams {
  args: any;
  containerId: string;
}

export type DeserializePropsCallback = (params: DeserializePropsParams) => any;
export interface DeserializePropsParams {
  containerId: string;
  props: Props;
}

export type EventArgs = { event: any };

export interface InvokeInternalCallbackParams {
  args: SerializedArgs | EventArgs;
  callback: Function;
}

export interface InvokeExternalCallbackParams {
  args: SerializedArgs;
  callbacks: CallbackMap;
  containerId: string;
  initExternalCallbackInvocation<T>(): ExternalCallbackInvocation<T>;
  invokeInternalCallback: (args: InvokeInternalCallbackParams) => any;
  method: string;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  serializeArgs: SerializeArgsCallback;
}

export type PostMessageComponentInvocationCallback = (
  message: PostMessageComponentCallbackInvocationParams
) => void;

export interface PostMessageComponentCallbackInvocationParams {
  args: any[];
  callbacks: CallbackMap;
  containerId: string;
  method: string;
  requestId: string;
  serializeArgs: SerializeArgsCallback;
  targetId: string | null;
}

export type PostMessageComponentResponseCallback = (
  message: PostMessageComponentCallbackResponseParams
) => void;
export interface PostMessageComponentCallbackResponseParams {
  containerId: string;
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
  containerId: string;
  node: SerializedNode;
  trust: ComponentTrust;
}

export interface ContainerComponent extends FunctionComponent {
  isRootContainerComponent: boolean;
}

interface ComposeRenderMethodsParams {
  containerId: string;
  isComponent: (component: Function) => boolean;
  isExternalComponent: (component: ContainerComponent) => boolean;
  isFragment: (component: Function) => boolean;
  isRootComponent: (component: ContainerComponent) => boolean;
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
  callbacks: CallbackMap;
  initExternalCallbackInvocation<T>(): ExternalCallbackInvocation<T>;
  isComponent: (component: Function) => boolean;
  parentContainerId: string | null;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
}

export type ComposeSerializationMethodsCallback = (
  params: ComposeSerializationMethodsParams
) => {
  deserializeArgs: DeserializeArgsCallback;
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
  callbacks: CallbackMap;
  containerId: string;
  deserializeArgs: DeserializeArgsCallback;
  deserializeProps: DeserializePropsCallback;
  initExternalCallbackInvocation<T>(): ExternalCallbackInvocation<T>;
  invokeInternalCallback: (args: InvokeInternalCallbackParams) => any;
  invokeExternalContainerCallback: (args: InvokeExternalCallbackParams) => any;
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
    composeMessagingMethods: ComposeMessagingMethodsCallback;
    composeRenderMethods: ComposeRenderMethodsCallback;
    composeSerializationMethods: ComposeSerializationMethodsCallback;
    dispatchRenderEvent: DispatchRenderEventCallback;
    invokeApplicationCallback: (args: InvokeExternalCallbackParams) => any;
    invokeInternalCallback: (args: InvokeInternalCallbackParams) => any;
    invokeExternalContainerCallback: (
      args: InvokeExternalCallbackParams
    ) => any;
    postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
    postCallbackResponseMessage: PostMessageComponentResponseCallback;
    postComponentRenderMessage: (p: any) => void;
  };
  context: {
    BWEComponent: FunctionComponent;
    Component: Function;
    componentPropsJson: object;
    containerId: string;
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
  containerId: string;
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
  containerId: string;
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

export type BWEComponentNode = VNode<BOSComponentProps>;

export interface PlaceholderNode {
  type: string;
  key: string;
  props: {
    id: string;
    className: string;
    children: ComponentChildren;
    'data-component-src': string;
  };
}
