import type { WalletSelectorParams } from '@near-wallet-selector/core';
import { useEffect, useState } from 'react';

export type SocialProfile = {
  description?: string;
  name?: string;
  image?: {
    ipfs_cid?: string;
    url?: string;
  };
  tags?: string[];
};

export function useSocialProfile(
  accountId: string | null | undefined,
  network?: WalletSelectorParams['network']
) {
  const [profile, setProfile] = useState<SocialProfile>();
  const profileImageUrl =
    profile?.image?.url ?? profile?.image?.ipfs_cid
      ? `https://ipfs.near.social/ipfs/${profile?.image?.ipfs_cid}`
      : undefined;

  useEffect(() => {
    if (!accountId) return;

    if (network === 'testnet') {
      throw new Error('useSocialProfile() does not support testnet yet (TODO)');
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('https://api.near.social/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keys: [`${accountId}/profile/**`],
          }),
        });

        if (!response.ok)
          throw new Error(
            `Failed to fetch Near Social profile data for accountId: ${accountId}`
          );

        const data: SocialProfile | undefined = (await response.json())?.[
          accountId
        ]?.profile;

        setProfile(data ?? {});
      } catch (error) {
        console.error('Social profile fetch error', error);
      }
    };

    fetchProfile();
  }, [accountId, network]);

  return {
    profile,
    profileImageUrl,
  };
}
