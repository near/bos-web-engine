import type { BOSModule } from '@bos-web-engine/common';
import {
  BLOCK_HEIGHT_KEY,
  SOCIAL_COMPONENT_NAMESPACE,
  SocialDb,
  SocialGetParams,
} from '@bos-web-engine/social-db-api';

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
    {} as ComponentSourcesResponse
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
      const {
        [SOCIAL_COMPONENT_NAMESPACE]: component,
        [BLOCK_HEIGHT_KEY]: componentBlockHeight,
      } = entryValue;

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
              blockHeight: componentBlockHeight,
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
  options = { withBlockHeight: true }
): Promise<Record<string, BOSModule>> {
  /*
    Typically, you'd want to pass a generic to `social.get<MyType>()`. This generic
    would be wrapped by DeepPartial (recursively flagging all properties as possibly
    undefined). However, we want this function to actually throw an error if it's trying
    to access a component (or property) that doesn't exist. That's why we cast with
    `as SocialComponentsByAuthor` - which will retain our purposefully "dangerous"
    `any` typings.
  */

  const keys = componentPaths.map(
    (p) => p.split('/').join(`/${SOCIAL_COMPONENT_NAMESPACE}/`) + '/*'
  );

  const socialGetParams: SocialGetParams = {
    keys,
  };

  if (options?.withBlockHeight) {
    const optionsWithBlockHeight = {
      with_block_height: true,
    };

    socialGetParams.options = optionsWithBlockHeight;

    const response = (await social.get(
      socialGetParams
    )) as SocialComponentsByAuthorWithBlockHeight;

    return prepareSourceWithBlockHeight(response);
  }

  const response = (await social.get(
    socialGetParams
  )) as SocialComponentsByAuthor;

  return prepareSource(response);
}
