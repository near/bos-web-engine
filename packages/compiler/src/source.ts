import {
  BLOCK_HEIGHT_KEY,
  SOCIAL_COMPONENT_NAMESPACE,
  SocialGetParams,
} from '@bos-web-engine/social-db';

import {
  ComponentSourcesResponse,
  FetchComponentSourcesParams,
  SocialComponentsByAuthor,
} from './types';

function prepareSourceWithBlockHeight(
  response: SocialComponentsByAuthor
): ComponentSourcesResponse {
  return Object.entries(response).reduce((sources, [entryKey, entryValue]) => {
    const { [SOCIAL_COMPONENT_NAMESPACE]: component } = entryValue;

    Object.entries(component).forEach(([componentKey, componentValue]) => {
      const sourceKey = `${entryKey}/${componentKey}`;
      sources[sourceKey] = {
        component: componentValue[''][''],
        css: componentValue.css[''],
        blockHeight: componentValue[BLOCK_HEIGHT_KEY],
      };
    });

    return sources;
  }, {} as ComponentSourcesResponse);
}

function extractObjectIdsFromResponse(
  response: SocialComponentsByAuthor
): SocialComponentsByAuthor {
  return Object.fromEntries(
    Object.entries(response)
      .filter(([entryKey]) => entryKey !== BLOCK_HEIGHT_KEY)
      .map(([author, { [SOCIAL_COMPONENT_NAMESPACE]: componentEntry }]) => [
        author,
        {
          [SOCIAL_COMPONENT_NAMESPACE]: Object.fromEntries(
            Object.entries(componentEntry).filter(
              ([entryKey]) => entryKey !== BLOCK_HEIGHT_KEY
            )
          ),
        },
      ])
  );
}

export async function fetchComponentSources({
  social,
  componentPaths,
  features,
}: FetchComponentSourcesParams) {
  const socialOptions = {
    with_block_height: true,
  };

  if (!features.enableBlockHeightVersioning) {
    const keys = componentPaths.map(
      (p) => p.split('/').join(`/${SOCIAL_COMPONENT_NAMESPACE}/`) + '/*'
    );

    const socialGetParams: SocialGetParams = {
      keys,
    };

    socialGetParams.options = socialOptions;

    const response = (await social.get(
      socialGetParams
    )) as SocialComponentsByAuthor;

    return prepareSourceWithBlockHeight(extractObjectIdsFromResponse(response));
  }

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

      socialGetParams.options = socialOptions;

      const response = (await social.get(
        socialGetParams
      )) as SocialComponentsByAuthor;

      if (!blockId) {
        return extractObjectIdsFromResponse(response);
      }

      return Object.fromEntries(
        Object.entries(response)
          .filter(([entryKey]) => entryKey !== BLOCK_HEIGHT_KEY)
          .map(([author, { [SOCIAL_COMPONENT_NAMESPACE]: componentEntry }]) => [
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
          ])
      );
    })
  );

  const aggregatedResponses = responsesWithBlockHeight.reduce(
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

  return prepareSourceWithBlockHeight(aggregatedResponses);
}
