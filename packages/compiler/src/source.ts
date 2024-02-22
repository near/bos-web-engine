import type { BOSModule } from '@bos-web-engine/common';
import {
  SOCIAL_COMPONENT_NAMESPACE,
  SocialDb,
} from '@bos-web-engine/social-db';

import { ComponentEntry } from './types';

export async function fetchComponentSources(
  social: SocialDb,
  componentPaths: string[]
) {
  /*
    Typically, you'd want to pass a generic to `social.get<MyType>()`. This generic
    would be wrapped by DeepPartial (recursively flagging all properties as possibly
    undefined). However, we want this function to actually throw an error if it's trying
    to access a component (or property) that doesn't exist. That's why we cast with
    `as SocialComponentsByAuthor` - which will retain our purposefully "dangerous"
    `any` typings.
  */

  type SocialComponentsByAuthor = {
    [author: string]: {
      [SOCIAL_COMPONENT_NAMESPACE]: { [name: string]: ComponentEntry };
    };
  };

  const keys = componentPaths.map(
    (p) => p.split('/').join(`/${SOCIAL_COMPONENT_NAMESPACE}/`) + '/*'
  );

  const response = (await social.get({
    keys,
  })) as SocialComponentsByAuthor;

  return Object.entries(response).reduce(
    (sources, [author, { [SOCIAL_COMPONENT_NAMESPACE]: componentEntry }]) => {
      Object.entries(componentEntry).forEach(([componentName, component]) => {
        if (component) {
          const { '': source, css } = component;
          sources[`${author}/${componentName}`] = {
            component: source,
            css,
          };
        } else {
          console.error(`Invalid component source: ${component}`);
        }
      });
      return sources;
    },
    {} as { [key: string]: BOSModule }
  );
}
