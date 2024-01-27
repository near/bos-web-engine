import { useWallet } from '@bos-web-engine/wallet-selector-control';
import { useEffect } from 'react';

import { useSandboxStore } from './useSandboxStore';
import { DEFAULT_SANDBOX_ACCOUNT_ID } from '../constants';

/*
  This hook is a temporary work around until proper syntax is supported 
  to reference local components. It swaps all default account references 
  in the source code to your current account.
*/

export function useSourceAccountReplace() {
  const { account } = useWallet();
  const files = useSandboxStore((store) => store.files);
  const setFiles = useSandboxStore((store) => store.setFiles);

  useEffect(() => {
    if (!account) return;

    Object.values(files).forEach((file) => {
      if (file) {
        const regex = new RegExp(`src="${DEFAULT_SANDBOX_ACCOUNT_ID}/`, 'g');
        file.source = file.source.replace(regex, `src="${account.accountId}/`);
      }
    });

    setFiles(files);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);
}
