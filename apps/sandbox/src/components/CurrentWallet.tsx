import { useWallet } from '@/hooks/useWallet';
import s from './CurrentWallet.module.css';

export function CurrentWallet() {
  const { walletSelectorState, walletSelectorModal } = useWallet();
  const account = walletSelectorState?.accounts[0];

  if (account) {
    return (
      <div className={s.wrapper}>
        <button type="button" onClick={() => walletSelectorModal?.show()}>
          {account.accountId}
        </button>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <button type="button" onClick={() => walletSelectorModal?.show()}>
        Sign In
      </button>
    </div>
  );
}
