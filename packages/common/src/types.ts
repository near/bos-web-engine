export enum TrustMode {
  Sandboxed = 'sandboxed',
  Trusted = 'trusted',
}

export interface ComponentTrust {
  mode: TrustMode;
}
