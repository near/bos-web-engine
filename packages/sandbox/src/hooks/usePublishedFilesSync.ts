import { useSocial } from '@bos-web-engine/social-db-api';
import { useWallet } from '@bos-web-engine/wallet-selector-control';
import { useEffect } from 'react';

import { useSandboxStore } from './useSandboxStore';
import { fetchPublishedFiles } from '../helpers/fetch-published-files';

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

    const fetchFilesForCurrentAccount = async () => {
      try {
        const files = await fetchPublishedFiles(social, account.accountId);
        setPublishedFiles(files);
      } catch (error) {
        console.error(
          'Failed to fetch published components for current account',
          error
        );
      }
    };

    fetchFilesForCurrentAccount();
  }, [account, hasResolved, mode, setPublishedFiles, social]);
}
