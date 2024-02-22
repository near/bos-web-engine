import { signMessage } from '@bos-web-engine/wallet-selector-plugin';
import { Buffer } from 'buffer';
import { useState } from 'react';

const generateNonce = () => {
  let nonceArray: Uint8Array = new Uint8Array(32);
  nonceArray = crypto.getRandomValues(nonceArray);
  return Buffer.from(nonceArray);
};

export default function () {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [signature, setSignature] = useState('');

  const sign = async () => {
    const { signature: signedMessage } = await signMessage({
      message,
      recipient,
      nonce: generateNonce(),
    });
    setSignature(signedMessage);
  };

  return (
    <div>
      <div>
        <span>Message to sign</span>
        <input type="text" onChange={(e) => setMessage(e.target.value)} />
      </div>
      <div>
        <span>Recipient</span>
        <input type="text" onChange={(e) => setRecipient(e.target.value)} />
      </div>
      <div>{signature || 'No message signed'}</div>
      <div>
        <button onClick={sign}>Sign Message</button>
      </div>
    </div>
  );
}
