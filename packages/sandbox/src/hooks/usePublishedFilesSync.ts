import {
  SOCIAL_COMPONENT_NAMESPACE,
  useSocial,
} from '@bos-web-engine/social-sdk';
import { useWallet } from '@bos-web-engine/wallet-selector-control';
import { useEffect } from 'react';

import { type SandboxFiles, useSandboxStore } from './useSandboxStore';
import { convertComponentNameToFilePath } from '../utils';

export function usePublishedFilesSync() {
  const { account } = useWallet();
  const { social } = useSocial();
  const setPublishedFiles = useSandboxStore((store) => store.setPublishedFiles);

  useEffect(() => {
    if (!account) return;

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
  }, [account, setPublishedFiles, social]);
}
