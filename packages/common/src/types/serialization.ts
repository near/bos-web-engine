import type { Props, WebEngineMeta } from './render';
import type { ComponentTrust } from './trust';

export type BOSComponentProps = Props & {
  bwe: WebEngineMeta;
};

export interface ComponentChildMetadata {
  componentId: string;
  props: Props;
  source: string;
  trust: ComponentTrust;
}

export type SerializedArgs = Array<
  string | number | object | any[] | { callbackIdentifier: string }
>;

export interface SerializedNode {
  childComponents?: ComponentChildMetadata[];
  type: string;
  props: Props;
}
