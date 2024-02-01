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

export function BWEComponent(props: { account: string }) {
  const defaults = {
    name: props.account,
    image: {
      ipfs_cid: 'bafkreibiyqabm3kl24gcb2oegb7pmwdi6wwrpui62iwb44l7uomnn3lhbi',
    },
  };

  const [profile, setProfile] = useState<Profile>();

  const fetchProfile = async () => {
    try {
      const response = await fetch('https://api.near.social/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keys: [`${props.account}/profile/**`],
        }),
      });
      if (!response.ok) throw new Error('profile fetch error');

      let p: Profile = (await response.json())?.[props.account]?.profile;
      // if (!p && response.ok) {
      //   // defaults
      //   p = {
      //     name: props.account,
      //     image: defaultImage,
      //   };
      // }
      // debugger;

      p = { ...defaults, ...p };
      console.log(p);
      setProfile(p);
    } catch (err) {
      console.log('profile fetch error', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return profile ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        columnGap: '0.5rem',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          flexShrink: 0,
          border: '1px solid #eceef0',
          overflow: 'hidden',
          borderRadius: '40px',
          transition: 'border-color 200ms',
        }}
      >
        <img
          src={
            profile.image?.url ||
            `https://ipfs.near.social/ipfs/${profile.image?.ipfs_cid}`
          }
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
            margin: '0 !important',
          }}
        />
      </div>
      <div>{profile.name}</div>
    </div>
  ) : (
    <>...</>
  );
}
