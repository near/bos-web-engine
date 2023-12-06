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
}

export interface ComponentCompilerResponse {
  componentId: string;
  componentSource: string;
  rawSource: string;
  componentPath: string;
  error?: Error;
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
  imports: ModuleImports[];
  transpiled: string;
}

export interface ParseComponentTreeParams {
  mapped: ComponentMap;
  transpiledComponent: string;
  componentPath: string;
  componentImports: ModuleImports[];
  isComponentPathTrusted?: (path: string) => boolean;
  trustedRoot?: TrustedRoot;
}

export interface TrustedRoot {
  rootPath: string;
  trustMode: string;
  /* predicates for determining trust under a trusted root */
  matchesRootAuthor: (path: string) => boolean;
}

export interface ComponentImport {
  statements: string[];
}

// mapping of component IDs to the set of statements
// required to assign aliases to imported references
export type ComponentImports = Map<string, ComponentImport>;

// container-wide imports
export interface ContainerImport {
  statements: string[];
  imports: ComponentImports;
}

// structured representation of import statement
export interface ModuleImports {
  imports: ImportExpression[];
  isSideEffect?: boolean;
  module: string;
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
