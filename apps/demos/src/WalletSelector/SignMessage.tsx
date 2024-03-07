import { signMessage } from '@bos-web-engine/wallet-selector-plugin';
import { Buffer } from 'buffer';
import { useState } from 'react';
import s from './SignMessage.module.css';

const generateNonce = () => {
  let nonceArray: Uint8Array = new Uint8Array(32);
  nonceArray = crypto.getRandomValues(nonceArray);
  return Buffer.from(nonceArray);
};

function SignMessage () {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [signature, setSignature] = useState('');

  const sign = async () => {
    const result = await signMessage({
      message,
      recipient,
      nonce: generateNonce(),
    });

    if (result) {
      setSignature(result.signature);
    } else {
      console.error('Sign message failed');
    }
  };

  return (
    <div className={s.wrapper}>
      <div className={s.entryRow}>
        <span>Message to sign</span>
        <textarea onChange={(e) => setMessage(e.target.value)} />
      </div>
      <div className={s.entryRow}>
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

export default SignMessage as BWEComponent;
