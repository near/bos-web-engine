import { socialDb, type SocialGetResponse } from "@bos-web-engine/social-db-plugin";
import { useState } from 'react';
import s from './styles.module.css';

type Data = {
  profile: {
    description: string;
    name: string;
  }
}

function SocialGet() {
  const [data, setData] = useState<SocialGetResponse<Data>>();
  const accountId = "root.near";
  const profile = data?.[accountId]?.profile;

  const loadData = async () => {
    const response = await socialDb.get<Data>({
      key: `${accountId}/profile/**`
    });
    setData(response);
  };

  return (
    <div className={s.wrapper}>
      <button onClick={loadData}>Fetch Example Profile Data</button>

      {profile && (
        <div className={s.data}>
          <p>Name: <b>{profile.name}</b></p>
          <p>Description: <b>{profile.description}</b></p>
        </div>
      )}
    </div>
  );
}

export default SocialGet as BWEComponent;
