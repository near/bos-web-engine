export interface WebEngineMeta {
  componentId?: string;
  parentMeta?: WebEngineMeta;
}

export interface KeyValuePair {
  [key: string]: any;
}

export interface Props extends KeyValuePair {
  __bweMeta?: WebEngineMeta;
  children?: any[];
  className?: string;
  id?: string;
  'data-component-src'?: string;
}
