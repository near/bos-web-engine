export type ComponentCompilerRequest =
  | CompilerExecuteAction
  | CompilerInitAction;

export interface CompilerExecuteAction {
  action: 'execute';
  componentId: string;
}

export interface CompilerInitAction {
  action: 'init';
  localFetchUrl?: string;
  preactVersion: string;
}

export interface ComponentCompilerResponse {
  componentId: string;
  componentSource: string;
  rawSource: string;
  componentPath: string;
  error?: Error;
  importedModules: Map<string, string>;
}

export type SendMessageCallback = (res: ComponentCompilerResponse) => void;

export interface ComponentCompilerParams {
  sendMessage: SendMessageCallback;
}

export interface TranspiledComponentLookupParams {
  componentPath: string;
  componentSource: string;
  isRoot: boolean;
}

export type ComponentMap = Map<string, ComponentTreeNode>;

export interface ComponentTreeNode {
  imports: ModuleImport[];
  transpiled: string;
}

export interface ParseComponentTreeParams {
  components: ComponentMap;
  componentSource: string;
  componentPath: string;
  isComponentPathTrusted?: (path: string) => boolean;
  isRoot: boolean;
  trustedRoot?: TrustedRoot;
}

export interface TrustedRoot {
  rootPath: string;
  trustMode: string;
  /* predicates for determining trust under a trusted root */
  matchesRootAuthor: (path: string) => boolean;
}

// structured representation of import statement
export interface ModuleImport {
  imports: ImportExpression[];
  isSideEffect?: boolean;
  moduleName: string;
}

// structured representation of individual imported reference statement
export interface ImportExpression {
  alias?: string;
  isDefault?: boolean;
  isDestructured?: boolean;
  isNamespace?: boolean;
  reference?: string;
}

interface SocialComponent {
  widget: { [name: string]: string };
}

export type SocialComponentsByAuthor = { [author: string]: SocialComponent };
