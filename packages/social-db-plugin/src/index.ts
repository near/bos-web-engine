import type { WebEngine, WebEngineContext } from '@bos-web-engine/common';
import type { SocialDb } from '@bos-web-engine/social-db';

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

    /*
      NOTE: The definition/type syntax used above gives us the benefit of pulling in 
      the correct TS Doc information when hovering over or interacting with any of 
      the plugin methods when exported. EG: `const set: SocialDb['set'] = ...`
    */

    return {
      socialDb: {
        get,
        set,
      },
    };
  }

  return window.webEngine.initPlugin<SocialDbPlugin>(initSocialDbPlugin);
}
