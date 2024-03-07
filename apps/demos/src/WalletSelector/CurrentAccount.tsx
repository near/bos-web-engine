import { getAccounts } from '@bos-web-engine/wallet-selector-plugin';
import { useEffect, useState } from 'react';
import s from './SignMessage.module.css';

function useCurrentAccount() {
  const [accountId, setAccountId] = useState('');

  useEffect(() => {
    const load = async () => {
      const accounts = await getAccounts();
      setAccountId(accounts[0]?.accountId ?? "");
    };

    load();
  }, []);

  return {
    accountId
  };
}

function CurrentAccount() {
  const { accountId } = useCurrentAccount();

  return (
    <div className={s.wrapper}>
      {accountId ? <p>You are signed in as: <b>{accountId}</b></p> : <p>You are not signed in.</p>}
    </div>
  );
}

export default CurrentAccount as BWEComponent;