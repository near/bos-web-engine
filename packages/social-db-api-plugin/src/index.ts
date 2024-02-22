import type { WebEngine, WebEngineContext } from '@bos-web-engine/common';
import type { SocialDb } from '@bos-web-engine/social-db-api';

declare global {
  interface Window {
    webEngine: WebEngine;
  }
}

type SocialDbPlugin = {
  socialDb: Pick<SocialDb, 'get' | 'set'>;
};

export default function initializeSocialDbPlugin() {
  function initSocialDbPlugin({
    callApplicationMethod,
  }: WebEngineContext): SocialDbPlugin {
    const get: SocialDb['get'] = (args) =>
      callApplicationMethod({
        args: [args],
        method: 'socialDb.get',
      });

    const set: SocialDb['set'] = (args) =>
      callApplicationMethod({
        args: [args],
        method: 'socialDb.set',
      });

    return {
      socialDb: {
        get,
        set,
      },
    };
  }

  return window.webEngine.initPlugin<SocialDbPlugin>(initSocialDbPlugin);
}
