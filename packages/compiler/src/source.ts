import type { BOSModule } from '@bos-web-engine/common';
import {
  BLOCK_HEIGHT_KEY,
  SOCIAL_COMPONENT_NAMESPACE,
  SocialDb,
  SocialGetParams,
} from '@bos-web-engine/social-db';

import {
  ComponentEntryWithBlockHeight,
  ComponentSourcesResponse,
  SocialComponentWithBlockHeight,
  SocialComponentsByAuthor,
  SocialComponentsByAuthorWithBlockHeight,
  SocialWidgetWithBlockHeight,
} from './types';

function prepareSource(response: SocialComponentsByAuthor): {
  [key: string]: BOSModule;
} {
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

function isNotABlockEntry<T>(
  entryKey: string,
  entryValue: any
): entryValue is T {
  return typeof entryValue !== 'number' && entryKey !== BLOCK_HEIGHT_KEY;
}

function prepareSourceWithBlockHeight(
  response: SocialComponentsByAuthorWithBlockHeight
) {
  return Object.entries(response).reduce((sources, [entryKey, entryValue]) => {
    if (
      isNotABlockEntry<SocialComponentWithBlockHeight>(entryKey, entryValue)
    ) {
      const { [SOCIAL_COMPONENT_NAMESPACE]: component } = entryValue;

      if (
        isNotABlockEntry<SocialWidgetWithBlockHeight>(
          SOCIAL_COMPONENT_NAMESPACE,
          component
        )
      ) {
        Object.entries(component).forEach(([componentKey, componentValue]) => {
          if (
            isNotABlockEntry<ComponentEntryWithBlockHeight>(
              componentKey,
              componentValue
            )
          ) {
            const sourceKey = `${entryKey}/${componentKey}`;
            sources[sourceKey] = {
              component: componentValue[''][''],
              css: componentValue.css[''],
              blockHeight: componentValue[BLOCK_HEIGHT_KEY],
            };
          }
        });
      }
    }

    return sources;
  }, {} as ComponentSourcesResponse);
}

export async function fetchComponentSources(
  social: SocialDb,
  componentPaths: string[],
  enableBlockHeightVersioning?: boolean,
  enablePersistentComponentCache?: boolean
) {
  let aggregatedResponses;

  if (enableBlockHeightVersioning) {
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

    const responsesWithBlockHeight = await Promise.all(
      componentsByBlockHeightArr.map(async ([blockId, keys]) => {
        const socialGetParams: SocialGetParams = {
          keys,
          blockId: Number(blockId),
        };

        if (enablePersistentComponentCache) {
          const socialOptions = {
            with_block_height: true,
          };

          socialGetParams.options = socialOptions;
        }

        const response = (await social.get(
          socialGetParams
        )) as SocialComponentsByAuthor;

        if (!blockId) {
          return response;
        }

        return Object.fromEntries(
          Object.entries(response)
            .filter(([entryKey]) => entryKey !== BLOCK_HEIGHT_KEY)
            .map(
              ([author, { [SOCIAL_COMPONENT_NAMESPACE]: componentEntry }]) => [
                author,
                {
                  [SOCIAL_COMPONENT_NAMESPACE]: Object.fromEntries(
                    Object.entries(componentEntry)
                      .filter(([entryKey]) => entryKey !== BLOCK_HEIGHT_KEY)
                      .map(([componentPath, componentSource]) => [
                        `${componentPath}@${blockId}`,
                        componentSource,
                      ])
                  ),
                },
              ]
            )
        );
      })
    );

    aggregatedResponses = responsesWithBlockHeight.reduce(
      (accumulator, response) => {
        Object.entries(response).forEach(
          ([author, { [SOCIAL_COMPONENT_NAMESPACE]: componentEntry }]) => {
            if (accumulator[author]?.[SOCIAL_COMPONENT_NAMESPACE]) {
              accumulator[author][SOCIAL_COMPONENT_NAMESPACE] = {
                ...accumulator[author][SOCIAL_COMPONENT_NAMESPACE],
                ...componentEntry,
              };
            } else {
              accumulator[author] = {
                [SOCIAL_COMPONENT_NAMESPACE]: componentEntry,
              };
            }
          }
        );

        return accumulator;
      },
      {}
    );
  } else {
    const keys = componentPaths.map(
      (p) => p.split('/').join(`/${SOCIAL_COMPONENT_NAMESPACE}/`) + '/*'
    );

    const socialGetParams: SocialGetParams = {
      keys,
    };

    if (enablePersistentComponentCache) {
      const socialOptions = {
        with_block_height: true,
      };

      socialGetParams.options = socialOptions;
    }

    aggregatedResponses = await social.get(socialGetParams);
  }

  if (enablePersistentComponentCache) {
    return prepareSourceWithBlockHeight(
      aggregatedResponses as SocialComponentsByAuthorWithBlockHeight
    );
  }

  return prepareSource(aggregatedResponses as SocialComponentsByAuthor);
}
