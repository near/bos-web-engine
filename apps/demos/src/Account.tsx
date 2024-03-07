import { useEffect, useState } from 'react';
import s from './Account.module.css';

type Props = {
  accountId: string;
};

type ProfileData = {
  description?: string;
  name?: string;
  image?: {
    ipfs_cid?: string;
    url?: string;
  };
  tags?: string[];
};

function Account({ accountId }: Props) {
  const defaults = {
    name: accountId,
    image: {
      ipfs_cid: 'bafkreibiyqabm3kl24gcb2oegb7pmwdi6wwrpui62iwb44l7uomnn3lhbi',
    },
  };

  const [profile, setProfile] = useState<ProfileData>();

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
      if (!response.ok) throw new Error('profile fetch error');
      let p: ProfileData = (await response.json())?.[accountId]?.profile;
      p = { ...defaults, ...p };
      setProfile(p);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return profile ? (
    <div className={s.wrapper}>
      <div className={s.avatar}>
        <img src={ profile.image?.url || `https://ipfs.near.social/ipfs/${profile.image?.ipfs_cid}` } />
      </div>
      <p className={s.name}>{profile.name}</p>
    </div>
  ) : (
    <>...</>
  );
}

export default Account as BWEComponent<Props>;