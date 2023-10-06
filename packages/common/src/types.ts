export enum TrustMode {
  Sandboxed = 'sandboxed',
  Trusted = 'trusted',
  TrustAuthor = 'trusted-author',
}

export interface ComponentTrust {
  mode: TrustMode;
}
