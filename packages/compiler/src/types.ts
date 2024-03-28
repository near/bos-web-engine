import type { BOSModule } from '@bos-web-engine/common';
import type {
  BLOCK_HEIGHT_KEY,
  SOCIAL_COMPONENT_NAMESPACE,
  SocialDb,
} from '@bos-web-engine/social-db';

export type ComponentCompilerRequest =
  | CompilerExecuteAction
  | CompilerInitAction;

export interface CompilerExecuteAction {
  action: 'execute';
  componentId: string;
}

export type LocalComponentMap = { [path: string]: BOSModule };

export interface FeatureFlags {
  enableBlockHeightVersioning?: boolean;
  enablePersistentComponentCache?: boolean;
}

export interface CompilerInitAction {
  action: 'init';
  localComponents?: LocalComponentMap;
  preactVersion: string;
  features: FeatureFlags;
}

export interface ComponentCompilerResponse {
  componentId: string;
  componentSource: string;
  containerStyles: string;
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
  isComponentPathTrusted: (path: string) => boolean;
  isRoot: boolean;
}

export type ComponentMap = Map<string, ComponentTreeNode>;

export interface ParsedCssModule {
  classMap: Map<string, string>;
  stylesheet: string;
}

export interface ComponentTreeNode {
  css?: string;
  imports: ModuleImport[];
  transpiled: string;
}

export interface ParseComponentTreeParams {
  components: ComponentMap;
  componentSource: string;
  componentStyles?: string;
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
  isBweModule?: boolean;
  isCssModule: boolean;
  isPackage: boolean;
  isPlugin: boolean;
  isRelative?: boolean;
  isSideEffect?: boolean;
  moduleName: string;
  modulePath: string;
}

// structured representation of individual imported reference statement
export interface ImportExpression {
  alias?: string;
  isDefault?: boolean;
  isDestructured?: boolean;
  isNamespace?: boolean;
  reference?: string;
}

export interface ComponentEntry {
  '': string;
  css: string;
}

export interface ModuleExport {
  default: string;
  named: string[];
}

interface WithBlockHeight {
  [BLOCK_HEIGHT_KEY]: number;
}

interface SourceWithBlockHeight extends WithBlockHeight {
  '': string;
}

export interface ComponentEntryWithBlockHeight extends WithBlockHeight {
  '': SourceWithBlockHeight;
  css: SourceWithBlockHeight;
}

interface SocialWidget {
  [name: string]: ComponentEntry;
}

export interface SocialWidgetWithBlockHeight {
  [name: string]: ComponentEntryWithBlockHeight | number;
}

interface SocialComponent {
  [SOCIAL_COMPONENT_NAMESPACE]: SocialWidget;
}

export interface SocialComponentWithBlockHeight
  extends WithBlockHeight,
    SocialWidgetWithBlockHeight {}

export interface SocialComponentsByAuthor {
  [author: string]: SocialComponent;
}

export interface SocialComponentsByAuthorWithBlockHeight {
  [authorOrBlockHeight: string]: SocialComponentWithBlockHeight | number;
}

export type ComponentSourcesResponse = { [key: string]: BOSModule };

export interface ComponentCacheRecord {
  key: string;
  componentSource: string;
  containerStyles: string;
  importedModules: Map<string, string>;
}

export interface FeatureFlags {

}

export interface FetchComponentSourcesParams {
  social: SocialDb,
  componentPaths: string[],
  features: FeatureFlags;
}