import { socialDb } from '@bos-web-engine/social-db-plugin';
import { useState } from 'react';
import s from './styles.module.css';

function SocialSet() {
  /*
    NOTE: We don't currently have a way to pull in the current 
    accountId that the user is signed in with. This means we can't 
    populate the input with your current name.

    https://github.com/near/bos-web-engine/issues/311
  */

  const [name, setName] = useState('');
  const [isUpdated, setIsUpdated] = useState(false);

  const submit = async () => {
    const result = await socialDb.set({
      data: {
        profile: {
          name
        }
      }
    });

    setIsUpdated(true);

    console.log('Transaction Result', result);
  };

  return (
    <div className={s.wrapper}>
      <input placeholder="Enter new profile name..." type="text" value={name} onChange={(event) => setName(event.target.value)} />
      <button onClick={submit}>Set Profile Name</button>
      {isUpdated && <p className={s.success}>Name updated! Refresh the page to see your updated name in the main header (top right).</p>}
    </div>
  );
}

export default SocialSet as BWEComponent;