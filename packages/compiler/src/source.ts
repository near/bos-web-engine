import {
  BLOCK_HEIGHT_KEY,
  SOCIAL_COMPONENT_NAMESPACE,
  SocialGetParams,
} from '@bos-web-engine/social-db';

import {
  ComponentEntryWithBlockHeight,
  ComponentSourcesResponse,
  FetchComponentSourcesParams,
  SocialComponentWithBlockHeight,
  SocialComponentsByAuthorWithBlockHeight,
  SocialWidgetWithBlockHeight,
} from './types';

function isNotABlockEntry<T>(
  entryKey: string,
  entryValue: any
): entryValue is T {
  return typeof entryValue !== 'number' && entryKey !== BLOCK_HEIGHT_KEY;
}

function prepareSourceWithBlockHeight(
  response: SocialComponentsByAuthorWithBlockHeight
): ComponentSourcesResponse {
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
    )) as SocialComponentsByAuthorWithBlockHeight;

    return prepareSourceWithBlockHeight(response);
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

  const responsesWithBlockHeight: SocialComponentsByAuthorWithBlockHeight[] =
    await Promise.all(
      componentsByBlockHeightArr.map(async ([blockId, keys]) => {
        const socialGetParams: SocialGetParams = {
          keys,
          blockId: Number(blockId),
        };

        socialGetParams.options = socialOptions;

        const response = (await social.get(
          socialGetParams
        )) as SocialComponentsByAuthorWithBlockHeight;

        if (!blockId) {
          return response;
        }

        return Object.fromEntries(
          Object.entries(response).map(([author, entryValue]) => {
            if (author === BLOCK_HEIGHT_KEY) {
              return [author, entryValue];
            }
            const { [SOCIAL_COMPONENT_NAMESPACE]: componentEntry } =
              entryValue as SocialComponentWithBlockHeight;
            return [
              author,
              {
                [SOCIAL_COMPONENT_NAMESPACE]: Object.fromEntries(
                  Object.entries(componentEntry).map(
                    ([componentPath, componentSource]) => {
                      if (componentPath === BLOCK_HEIGHT_KEY) {
                        return [componentPath, componentSource];
                      }
                      return [`${componentPath}@${blockId}`, componentSource];
                    }
                  )
                ),
              },
            ];
          })
        );
      })
    );

  const aggregatedResponses = responsesWithBlockHeight.reduce(
    (accumulator, response) => {
      Object.entries(response).forEach(([author, entryValue]) => {
        if (isNotABlockEntry<SocialWidgetWithBlockHeight>(author, entryValue)) {
          const { [SOCIAL_COMPONENT_NAMESPACE]: componentEntry } = entryValue;
          let currentAuthor = accumulator[
            author
          ] as SocialWidgetWithBlockHeight;
          let currentAuthorPayload = currentAuthor?.[
            SOCIAL_COMPONENT_NAMESPACE
          ] as ComponentEntryWithBlockHeight;

          if (currentAuthorPayload) {
            (accumulator[author] as SocialWidgetWithBlockHeight)[
              SOCIAL_COMPONENT_NAMESPACE
            ] = {
              ...currentAuthorPayload,
              ...(componentEntry as ComponentEntryWithBlockHeight),
            };
          } else {
            (accumulator[author] as SocialWidgetWithBlockHeight) = {
              [SOCIAL_COMPONENT_NAMESPACE]: componentEntry,
            };
          }
        } else {
          accumulator[author] = entryValue;
        }
      });

      return accumulator;
    },
    {}
  );

  return prepareSourceWithBlockHeight(aggregatedResponses);
}
