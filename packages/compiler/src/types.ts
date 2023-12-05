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

export interface ParseComponentTreeParams {
  mapped: { [key: string]: { transpiled: string } };
  transpiledComponent: string;
  componentPath: string;
  isComponentPathTrusted?: (path: string) => boolean;
  trustedRoot?: TrustedRoot;
}

export interface TrustedRoot {
  rootPath: string;
  trustMode: string;
  /* predicates for determining trust under a trusted root */
  matchesRootAuthor: (path: string) => boolean;
}
// mapping of component IDs to the set of statements
// required to assign aliases to imported references
export type ComponentImports = Map<string, string[]>;

// imported references for a single Component
export interface BOSComponent {
  componentId: string;
  importReferences?: (ImportExpression | null)[];
  source: string;
}

// container-wide imports
export interface ContainerImport {
  statements: string[];
  imports: ComponentImports;
}

// structured representation of import statement
export interface ImportExpression {
  alias?: string;
  isDefault?: boolean;
  isDestructured?: boolean;
  isNamespace?: boolean;
  reference?: string;
}

export interface ImportTypes {
  topLevelImports: ImportExpression[];
  destructuredImports: ImportExpression[];
}

interface SocialComponent {
  widget: { [name: string]: string };
}

export type SocialComponentsByAuthor = { [author: string]: SocialComponent };
