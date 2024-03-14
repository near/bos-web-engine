import type { ComponentTrust } from './trust';

export interface WebEngineMeta {
  componentId?: string;
  parentMeta?: WebEngineMeta;
  src?: string;
  trust?: ComponentTrust;
}

export interface KeyValuePair {
  [key: string]: any;
}

export interface Props extends KeyValuePair {
  bwe?: WebEngineMeta;
  children?: any[];
  className?: string;
  id?: string;
  'data-component-src'?: string;
}
