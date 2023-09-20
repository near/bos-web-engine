export type Args = Array<Cloneable>;

export interface WebEngineMeta {
  componentId?: string;
  isProxy?: boolean;
  parentMeta?: WebEngineMeta;
}

export type BuildRequestCallback = () => CallbackRequest;

export interface CallbackRequest {
  promise: Promise<any>,
  rejecter?: (reason: any) => void;
  resolver?: (value: any) => void;
}

export type CallbackMap = { [key: string]: Function };

export type Cloneable = object | string | number | null | undefined | RegExp;

export type DeserializePropsCallback = (props: DeserializePropsParams) => any;
export interface DeserializePropsParams {
  buildRequest: BuildRequestCallback;
  props: SerializedProps;
  callbacks: CallbackMap;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  requests: { [key: string]: CallbackRequest }
  componentId: string;
}

export type EventArgs = { event: any };

export interface CallbackInvocationEventData {
  args: Args;
  method: string;
  originator: string;
  requestId: string;
  targetId: string;
  type: ComponentCallbackInvocationType;
}

export interface CallbackResponseEventData {
  requestId: string;
  result: string;
  targetId: string;
  type: ComponentCallbackResponseType;
}

export interface DomCallbackEventData {
  args: Args;
  method: string;
  type: ComponentDomCallbackType;
}

export interface RenderEventData {
  childComponents: any[];
  isTrusted: boolean;
  node: SerializedNode;
  componentId: string;
  type: ComponentRenderType;
}

export interface UpdateEventData {
  componentId: string;
  props: NodeProps | ComponentProps;
  type: ComponentUpdateType;
}

export interface ComponentSourceData {
  isTrusted: boolean;
  source: string;
  type: TranspilerComponentFetchType;
}

export type EventData = CallbackInvocationEventData
  | CallbackResponseEventData
  | DomCallbackEventData
  | RenderEventData
  | UpdateEventData
  | ComponentSourceData;

type TranspilerComponentFetchType = 'transpiler.componentFetch';
type ComponentCallbackInvocationType = 'component.callbackInvocation';
type ComponentCallbackResponseType = 'component.callbackResponse';
type ComponentDomCallbackType = 'component.domCallback';
type ComponentRenderType = 'component.render';
type ComponentUpdateType = 'component.update';
export type EventType = ComponentCallbackInvocationType | ComponentCallbackResponseType | ComponentDomCallbackType | ComponentRenderType | ComponentUpdateType;

export interface InitNearParams {
  renderComponent: () => void;
  rpcUrl: string;
}

export interface InitSocialParams {
  endpointBaseUrl: string;
  renderComponent: Function;
  sanitizeString: (s: string) => string;
  componentId: string;
}

export interface InvokeCallbackParams {
  args: Args | EventArgs;
  callback: Function;
}

export interface InvokeComponentCallbackParams {
  args: Args;
  buildRequest: BuildRequestCallback;
  callbacks: CallbackMap;
  method: string;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  requests: { [key: string]: CallbackRequest };
  serializeArgs: SerializeArgsCallback;
  componentId: string;
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

export interface PostMessageParams {
  type: EventType;
}

export type PostMessageComponentInvocationCallback = (message: PostMessageComponentCallbackInvocationParams) => void;
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
  requestId: string;
  serializeArgs: SerializeArgsCallback;
  targetId: string;
  componentId: string;
}

export type PostMessageComponentResponseCallback = (message: PostMessageComponentCallbackResponseParams) => void;
export interface ComponentCallbackResponse extends PostMessageParams {
  requestId: string;
  result: string; // stringified JSON in the form of { result: any, error: string }
  targetId: string;
  type: ComponentCallbackResponseType;
}
export interface PostMessageComponentCallbackResponseParams {
  error: Error | null;
  requestId: string;
  result: any;
  targetId: string;
}

export interface ComponentRender extends PostMessageParams {
  childComponents: string[];
  isTrusted: boolean;
  node: SerializedNode;
  type: ComponentRenderType;
  componentId: string;
}
export interface PostMessageComponentRenderParams {
  childComponents: string[];
  isTrusted: boolean;
  node: SerializedNode;
  componentId: string;
}

export interface ComponentUpdate extends PostMessageParams {
  props: any;
  type: ComponentUpdateType;
  componentId: string;
}

export type ComponentEventData = ComponentCallbackInvocation | ComponentCallbackResponse | ComponentRender | ComponentUpdate;

export interface ProcessEventParams {
  buildRequest: BuildRequestCallback;
  builtinComponents: BuiltinComponents;
  callbacks: CallbackMap;
  deserializeProps: DeserializePropsCallback;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  postCallbackResponseMessage: PostMessageComponentResponseCallback;
  props: any;
  renderDom: (node: any) => object;
  renderComponent: () => void;
  requests: { [key: string]: CallbackRequest };
  serializeArgs: SerializeArgsCallback;
  serializeNode: SerializeNodeCallback;
  setProps: (props: object) => boolean;
  componentId: string;
}

export interface Props extends KeyValuePair {
  __domcallbacks?: { [key: string]: any };
  __componentcallbacks?: { [key: string]: any };
  children?: any[];
}

export type SerializedArgs = Array<string | number | object | any[] | { __componentMethod: string }>;
export type SerializeArgsCallback = (args: SerializeArgsParams) => SerializedArgs;
export interface SerializeArgsParams {
  args: any[];
  callbacks: CallbackMap;
  componentId: string;
}

interface PreactElement {
  type: string;
  props: any;
}

type PreactCreateElement = (type: string | Function, props: any, children: any) => PreactElement;
type CreateSerializedBuiltin = ({ props, children }: BuiltinProps<any>) => PreactElement;

export interface GetBuiltinsParams {
  createElement: PreactCreateElement;
}

export interface BuiltinComponents {
  Checkbox: CreateSerializedBuiltin;
  CommitButton: CreateSerializedBuiltin
  Dialog: CreateSerializedBuiltin
  DropdownMenu: CreateSerializedBuiltin
  Files: CreateSerializedBuiltin;
  Fragment: CreateSerializedBuiltin
  InfiniteScroll: CreateSerializedBuiltin;
  IpfsImageUpload: CreateSerializedBuiltin;
  Link: CreateSerializedBuiltin;
  Markdown: CreateSerializedBuiltin;
  OverlayTrigger: CreateSerializedBuiltin;
  Tooltip: CreateSerializedBuiltin;
  Typeahead: CreateSerializedBuiltin;
}

export interface Node {
  type: string | Function;
  props?: NodeProps;
}

export interface SerializeNodeParams {
  builtinComponents: BuiltinComponents;
  node: Node;
  childComponents: any[];
  callbacks: CallbackMap;
  parentId: string;
}
export type SerializeNodeCallback = (args: SerializeNodeParams) => SerializedNode;

export interface SerializedNode {
  childComponents?: SerializedNode[];
  type: string;
  props: NodeProps | ComponentProps;
}

export interface SerializedProps extends KeyValuePair {
  __componentcallbacks?: {
    [key: string]: SerializedComponentCallback;
  };
}

export interface SerializePropsParams {
  builtinComponents: BuiltinComponents;
  callbacks: CallbackMap;
  parentId: string;
  props: any;
  componentId?: string;
}

export interface SerializedComponentCallback {
  __componentMethod: string;
  parentId: string;
}

export interface ComponentProps {
  __bweMeta?: WebEngineMeta;
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

type BuiltinPropsTypes = object // TODO props for remaining builtins
  | FilesProps
  | IpfsImageUploadProps
  | InfiniteScrollProps
  | MarkdownProps
  | OverlayTriggerProps
  | TypeaheadProps
  | ComponentProps;

export interface BuiltinProps<T extends BuiltinPropsTypes> {
  children: any[];
  props: T;
}
