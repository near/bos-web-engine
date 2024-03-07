import { signAndSendTransaction } from '@bos-web-engine/wallet-selector-plugin';
import { parseNearAmount } from '@near-js/utils';
import { useState } from 'react';
import s from './SignAndSendMessage.module.css';

function SignAndSendMessage() {
  const [transferAmount, setTransferAmount] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [transaction, setTransaction] = useState('');

  const signAndSend = async () => {
    const result = await signAndSendTransaction({
      actions: [
        {
          type: 'Transfer',
          params: {
            deposit: parseNearAmount(transferAmount),
          },
        },
      ],
      receiverId,
    });
    
    if (result) {
      setTransaction(JSON.stringify(result.transaction, null, 2));
    } else {
      console.error('Transaction failed');
    }
  };

  return (
    <div className={s.wrapper}>
      <div className={s.entryRow}>
        <span>⋈ to transfer</span>
        <input
          type="text"
          onChange={(e) => setTransferAmount(e.target.value)}
        />
      </div>
      <div className={s.entryRow}>
        <span>Recipient</span>
        <input type="text" onChange={(e) => setReceiverId(e.target.value)} />
      </div>
      <div>{transaction}</div>
      <div>
        <button onClick={signAndSend}>Send Near</button>
      </div>
    </div>
  );
}

export default SignAndSendMessage as BWEComponent;
