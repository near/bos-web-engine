import { signMessage } from '@bos-web-engine/wallet-selector-plugin';
import { Buffer } from 'buffer';
import { useCallback, useState } from 'react';

export default function () {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [signature, setSignature] = useState('');

  const generateNonce = useCallback(() => {
    let nonceArray: Uint8Array = new Uint8Array(32);
    nonceArray = crypto.getRandomValues(nonceArray);
    return Buffer.from(nonceArray);
  }, []);

  const sign = useCallback(async () => {
    const { signature: signedMessage } = await signMessage({
      message,
      recipient,
      nonce: generateNonce(),
    });
    setSignature(signedMessage);
  }, [message, recipient]);

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
