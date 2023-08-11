export type Args = Array<Cloneable>;

export type BuildRequestCallback = () => CallbackRequest;

export interface CallbackRequest {
  promise: Promise<any>,
  rejecter?: (reason: any) => void;
  resolver?: (value: any) => void;
}

export type CallbackMap = { [key: string]: Function };

export type Cloneable = object | string | number | null | undefined | RegExp;

export type DeserializePropsCallback = (props: DeserializePropsOptions) => any;
export interface DeserializePropsOptions {
  buildRequest: BuildRequestCallback;
  props: SerializedProps;
  callbacks: CallbackMap;
  postCallbackInvocationMessage: PostMessageWidgetInvocationCallback;
  requests: { [key: string]: CallbackRequest }
  widgetId: string;
}

export type EventArgs = { event: any };

export interface CallbackInvocationEventData {
  args: Args;
  method: string;
  originator: string;
  requestId: string;
  targetId: string;
  type: WidgetCallbackInvocation;
}

export interface CallbackResponseEventData {
  isComponent: boolean;
  requestId: string;
  result: string;
  targetId: string;
  type: WidgetCallbackResponse;
}

export interface DomCallbackEventData {
  args: Args;
  method: string;
  type: WidgetDomCallback;
}

export interface RenderEventData {
  childWidgets: any[];
  node: SerializedNode;
  widgetId: string;
  type: WidgetRender;
}

export interface UpdateEventData {
  props: NodeProps | WidgetProps;
  type: WidgetUpdate;
}

export interface WidgetSourceData {
  source: string;
  type: TranspilerWidgetFetch;
}

export type EventData = CallbackInvocationEventData
  | CallbackResponseEventData
  | DomCallbackEventData
  | RenderEventData
  | UpdateEventData
  | WidgetSourceData;

type TranspilerWidgetFetch = 'transpiler.widgetFetch';
type WidgetCallbackInvocation = 'widget.callbackInvocation';
type WidgetCallbackResponse = 'widget.callbackResponse';
type WidgetDomCallback = 'widget.domCallback';
type WidgetRender = 'widget.render';
type WidgetUpdate = 'widget.update';
export type EventType = WidgetCallbackInvocation | WidgetCallbackResponse | WidgetRender | WidgetUpdate;

export interface InitNearOptions {
  renderWidget: () => void;
  rpcUrl: string;
}

export interface InitSocialOptions {
  endpointBaseUrl: string;
  renderWidget: Function;
  widgetId: string;
}

export interface InvokeCallbackOptions {
  args: Args | EventArgs;
  callback: Function;
}

export interface InvokeWidgetCallbackOptions {
  args: Args;
  buildRequest: BuildRequestCallback;
  callbacks: CallbackMap;
  method: string;
  postCallbackInvocationMessage: PostMessageWidgetInvocationCallback;
  requests: { [key: string]: CallbackRequest };
  serializeArgs: SerializeArgsCallback;
  widgetId: string;
}

export interface KeyValuePair {
  [key: string]: any;
}

export interface NodeProps extends Props {
  children: any[];
}


export interface PostMessageEvent {
  data: EventData;
}

export interface PostMessageOptions {
  type: EventType;
}

export type PostMessageWidgetInvocationCallback = (message: PostMessageWidgetCallbackInvocationOptions) => void;
export interface PostMessageWidgetCallbackInvocation extends PostMessageOptions {
  args: SerializedArgs;
  method: string;
  originator: string;
  requestId: string;
  targetId: string;
  type: WidgetCallbackInvocation;
}
export interface PostMessageWidgetCallbackInvocationOptions {
  args: any[];
  callbacks: CallbackMap;
  method: string;
  requestId: string;
  serializeArgs: SerializeArgsCallback;
  targetId: string;
  widgetId: string;
}

export type PostMessageWidgetResponseCallback = (message: PostMessageWidgetCallbackResponseOptions) => void;
export interface PostMessageWidgetCallbackResponse extends PostMessageOptions {
  isComponent: boolean;
  requestId: string;
  result: string; // stringified JSON in the form of { result: any, error: string }
  targetId: string;
  type: WidgetCallbackResponse;
}
export interface PostMessageWidgetCallbackResponseOptions {
  error: Error | null;
  isComponent: boolean;
  requestId: string;
  result: any;
  targetId: string;
}

export interface PostMessageWidgetRender extends PostMessageOptions {
  childWidgets: string[];
  node: SerializedNode;
  type: WidgetRender;
  widgetId: string;
}
export interface PostMessageWidgetRenderOptions {
  childWidgets: string[];
  node: SerializedNode;
  widgetId: string;
}

export interface PostMessageWidgetUpdate extends PostMessageOptions {
  props: any;
  type: WidgetUpdate;
}
export interface PostMessageWidgetUpdateOptions {
  props: any;
}

export interface ProcessEventOptions {
  buildRequest: BuildRequestCallback;
  callbacks: CallbackMap;
  deserializeProps: DeserializePropsCallback;
  postCallbackInvocationMessage: PostMessageWidgetInvocationCallback;
  postCallbackResponseMessage: PostMessageWidgetResponseCallback;
  props: any;
  renderDom: (node: any) => object;
  renderWidget: () => void;
  requests: { [key: string]: CallbackRequest };
  serializeArgs: SerializeArgsCallback;
  setProps: (props: object) => boolean;
  widgetId: string;
}

export interface Props extends KeyValuePair {
  __domcallbacks: { [key: string]: any };
  __widgetcallbacks: { [key: string]: any };
  children?: any[];
}

export type SerializedArgs = Array<string | number | object | any[] | { __widgetMethod: string }>;
export type SerializeArgsCallback = (args: SerializeArgsOptions) => SerializedArgs;
export interface SerializeArgsOptions {
  args: any[];
  callbacks: CallbackMap;
  widgetId: string;
}

export interface SerializeNodeOptions {
  h: (type: string | Function, props: any, children: any) => any;
  node: any;
  index: number;
  childWidgets: any[];
  callbacks: CallbackMap;
  parentId: string;
}

export interface SerializedNode {
  childWidgets?: SerializedNode[];
  type: string;
  props: NodeProps | WidgetProps;
}

export interface SerializedProps extends KeyValuePair {
  __widgetcallbacks?: {
    [key: string]: SerializedWidgetCallback;
  };
}

export interface SerializePropsOptions {
  callbacks: CallbackMap;
  h: (type: string | Function, props: any, children: any) => any;
  parentId: string;
  props: any;
  widgetId?: string;
}

export interface SerializedWidgetCallback {
  __widgetMethod: string;
  parentId: string;
}

export interface WidgetCallbackInvocationResult {
  isComponent: boolean;
  result?: any;
  shouldRender: boolean;
}

export interface WidgetProps {
  children?: any[];
  id: string;
}

// builtin component props
export interface FilesProps {
  accepts: string[];
  className: string;
  clickable: boolean;
  minFileSize: number;
  multiple: boolean;
  onChange: (files: any[]) => {};
}

export interface IpfsImageUploadProps {
  img: string;
}

export interface InfiniteScrollProps {
  pageStart: number;
  loadMore: () => {};
  hasMore: boolean;
  loader: any; // Component
}

export interface MarkdownProps {
  text: string;
}

export interface OverlayTriggerProps {
  delay: { hide: number; show: number };
  overlay: any;
  placement: string;
  show: boolean;
  trigger: string[];
}

export interface TypeaheadProps {
  multiple: boolean;
  onChange: (value: any) => {};
  options: string[];
  placeholder: string;
}
