import {
  SOCIAL_COMPONENT_NAMESPACE,
  useSocial,
} from '@bos-web-engine/social-db-api';
import { useWallet } from '@bos-web-engine/wallet-selector-control';
import { useEffect } from 'react';

import { type SandboxFiles, useSandboxStore } from './useSandboxStore';
import { convertComponentNameToFilePath } from '../utils';

export function usePublishedFilesSync() {
  const { account, hasResolved } = useWallet();
  const { social } = useSocial();
  const mode = useSandboxStore((store) => store.mode);
  const setPublishedFiles = useSandboxStore((store) => store.setPublishedFiles);

  useEffect(() => {
    if (!account) {
      if (hasResolved) setPublishedFiles({});
      return;
    }

    const fetchPublishedFiles = async () => {
      try {
        const response = await social.get<{
          [SOCIAL_COMPONENT_NAMESPACE]: {
            [componentName: string]: {
              '': string;
            };
          };
        }>({
          key: `${account.accountId}/${SOCIAL_COMPONENT_NAMESPACE}/**`,
        });

        const publishedFiles: SandboxFiles = {};
        const accountData = response[account.accountId];
        const componentsData =
          (accountData ?? {})[SOCIAL_COMPONENT_NAMESPACE] ?? {};

        Object.entries(componentsData).forEach(([componentName, component]) => {
          if (component) {
            const filePath = convertComponentNameToFilePath(componentName);
            publishedFiles[filePath] = {
              source: component[''] ?? '',
            };
          }
        });

        setPublishedFiles(publishedFiles);
      } catch (error) {
        console.error(
          'Failed to fetch published components for current account',
          error
        );
      }
    };

    fetchPublishedFiles();
  }, [account, hasResolved, mode, setPublishedFiles, social]);
}
