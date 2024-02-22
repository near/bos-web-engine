import {
  SOCIAL_COMPONENT_NAMESPACE,
  type SocialDb,
} from '@bos-web-engine/social-db';

import { type SandboxFiles } from '../hooks/useSandboxStore';
import { convertComponentNameToFilePath } from '../utils';

export async function fetchPublishedFiles(social: SocialDb, accountId: string) {
  const response = await social.get<{
    [SOCIAL_COMPONENT_NAMESPACE]: {
      [componentName: string]: {
        '': string;
        css: string;
      };
    };
  }>({
    key: `${accountId}/${SOCIAL_COMPONENT_NAMESPACE}/**`,
  });

  const publishedFiles: SandboxFiles = {};
  const accountData = response[accountId];
  const componentsData = (accountData ?? {})[SOCIAL_COMPONENT_NAMESPACE] ?? {};

  Object.entries(componentsData).forEach(([componentName, component]) => {
    if (component) {
      const filePathTsx = convertComponentNameToFilePath(componentName, 'tsx');

      publishedFiles[filePathTsx] = {
        css: component.css ?? '',
        source: component[''] ?? '',
      };
    }
  });

  return publishedFiles;
}
