import type { Props } from './render';
import { KeyValuePair } from './render';
import type { ComponentTrust } from './trust';

export interface ComponentChildMetadata {
  componentId: string;
  props: Props;
  source: string;
  trust: ComponentTrust;
}

export type SerializedArgs = Array<
  string | number | object | any[] | { __componentMethod: string }
>;

export interface SerializedNode {
  childComponents?: ComponentChildMetadata[];
  type: string;
  props: Props;
}

export interface SerializedComponentCallback {
  __componentMethod: string;
  parentId: string;
}

export interface SerializedProps extends KeyValuePair {
  __componentcallbacks?: {
    [key: string]: SerializedComponentCallback;
  };
}
