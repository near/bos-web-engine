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

  /**
   * Requested components mapped by the block heights to reduce the amount of social requests
   * If no block height specified - the "" key is used
   */
  const componentsByBlockHeight = componentPaths.reduce(
    (pathsByBlockHeight, componentPath) => {
      const [path, blockHeight] = componentPath.split('@');
      const blockHeightKey = blockHeight || '';

      if (!pathsByBlockHeight[blockHeightKey]) {
        pathsByBlockHeight[blockHeightKey] = [];
      }

      pathsByBlockHeight[blockHeightKey].push(
        path.split('/').join(`/${SOCIAL_COMPONENT_NAMESPACE}/`) + '/*'
      );

      return pathsByBlockHeight;
    },
    {} as Record<string, string[]>
  );

  const componentsByBlockHeightArr = Object.entries(componentsByBlockHeight);

  const responses = (await Promise.all(
    componentsByBlockHeightArr.map(([blockId, keys]) => {
      return social.get({
        keys,
        blockId: Number(blockId),
      });
    })
  )) as SocialComponentsByAuthor[];

  const flattenResponses = responses.reduce((accumulator, response, idx) => {
    Object.entries(response).forEach(
      ([author, { [SOCIAL_COMPONENT_NAMESPACE]: componentEntry }]) => {
        const componentEntryWithBlockHeight = Object.entries(
          componentEntry
        ).reduce(
          (
            entriesWithBlockHeightAccumulator,
            [componentName, componentSource]
          ) => {
            const [blockHeightFromRequest] = componentsByBlockHeightArr[idx];

            return {
              ...entriesWithBlockHeightAccumulator,
              [blockHeightFromRequest === ''
                ? componentName
                : `${componentName}@${blockHeightFromRequest}`]:
                componentSource,
            };
          },
          {} as Record<string, ComponentEntry>
        );

        if (accumulator[author]?.[SOCIAL_COMPONENT_NAMESPACE]) {
          accumulator[author][SOCIAL_COMPONENT_NAMESPACE] = {
            ...accumulator[author][SOCIAL_COMPONENT_NAMESPACE],
            ...componentEntryWithBlockHeight,
          };
        } else {
          accumulator[author] = {
            [SOCIAL_COMPONENT_NAMESPACE]: componentEntryWithBlockHeight,
          };
        }
      }
    );

    return accumulator;
  }, {} as SocialComponentsByAuthor);

  return Object.entries(flattenResponses).reduce(
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
