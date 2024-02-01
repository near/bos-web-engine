import { useEffect, useState } from 'react';

import { useSocial } from './useSocial';
import { SOCIAL_IPFS_BASE_URL } from '../constants';
import { SocialProfile } from '../types';

export function useSocialProfile(accountId: string | null | undefined) {
  const { social } = useSocial();
  const [profile, setProfile] = useState<SocialProfile>();
  const profileImageUrl =
    profile?.image?.url ?? profile?.image?.ipfs_cid
      ? `${SOCIAL_IPFS_BASE_URL}/${profile?.image?.ipfs_cid}`
      : undefined;

  useEffect(() => {
    if (!accountId || !social) return;

    const fetchProfile = async () => {
      try {
        const response = await social.get<{
          profile: SocialProfile;
        }>({
          key: `${accountId}/profile/**`,
        });

        setProfile(response[accountId]?.profile ?? {});
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfile();
  }, [accountId, social]);

  return {
    profile,
    profileImageUrl,
  };
}
