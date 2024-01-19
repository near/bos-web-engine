import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';

interface Profile {
  description?: string;
  name?: string;
  image?: {
    ipfs_cid?: string;
    url?: string;
  };
  tags?: string[];
}

export function useProfile() {
  const { account } = useWallet();
  const [profile, setProfile] = useState<Profile>();
  const profileImageUrl =
    profile?.image?.url ?? profile?.image?.ipfs_cid
      ? `https://ipfs.near.social/ipfs/${profile?.image?.ipfs_cid}`
      : undefined;

  useEffect(() => {
    if (!account) return;

    const fetchProfile = async () => {
      try {
        const response = await fetch('https://api.near.social/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keys: [`${account.accountId}/profile/**`],
          }),
        });

        if (!response.ok)
          throw new Error(
            `Failed to fetch Near Social profile data for accountId: ${account.accountId}`
          );

        const data: Profile | undefined = (await response.json())?.[
          account.accountId
        ]?.profile;

        setProfile(data ?? {});
      } catch (err) {
        console.log('profile fetch error', err);
      }
    };

    fetchProfile();
  }, [account]);

  return {
    profile,
    profileImageUrl,
  };
}
