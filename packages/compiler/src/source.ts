import {
  SOCIAL_COMPONENT_NAMESPACE,
  SocialSdk,
} from '@bos-web-engine/social-sdk';

import { BOSModuleEntry, ComponentEntry } from './types';

export async function fetchComponentSources(
  social: SocialSdk,
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
      [SOCIAL_COMPONENT_NAMESPACE]: { [name: string]: string | ComponentEntry };
    };
  };

  const response = (await social.get({
    keys: componentPaths.map((p) =>
      p.split('/').join(`/${SOCIAL_COMPONENT_NAMESPACE}/`)
    ),
  })) as SocialComponentsByAuthor;

  return Object.entries(response).reduce(
    (sources, [author, { [SOCIAL_COMPONENT_NAMESPACE]: component }]) => {
      Object.entries(component).forEach(([componentKey, componentSource]) => {
        if (typeof componentSource === 'string') {
          sources[`${author}/${componentKey}`] = {
            component: componentSource,
          };
        } else if (componentSource) {
          const { '': source, css } = componentSource;
          sources[`${author}/${componentKey}`] = {
            component: source,
            css,
          };
        } else {
          console.error(`Invalid component source: ${componentSource}`);
        }
      });
      return sources;
    },
    {} as { [key: string]: BOSModuleEntry }
  );
}
