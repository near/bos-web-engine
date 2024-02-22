import { signAndSendTransaction } from '@bos-web-engine/wallet-selector-plugin';
import { useState } from 'react';

export default function () {
  const [transferAmount, setTransferAmount] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [transaction, setTransaction] = useState('');

  const signAndSend = async () => {
    const { transaction } = await signAndSendTransaction({
      actions: [
        {
          type: 'Transfer',
          params: {
            deposit: transferAmount,
          },
        },
      ],
      receiverId,
    });
    setTransaction(JSON.stringify(transaction, null, 2));
  };

  return (
    <div>
      <div>
        <span>Amount to transfer</span>
        <input
          type="text"
          onChange={(e) => setTransferAmount(e.target.value)}
        />
      </div>
      <div>
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
