import { Sandbox } from '@bos-web-engine/sandbox';
import s from '@/styles/home.module.css';
import { useWallet } from '@/hooks/useWallet';

export default function Home() {
  const { walletSelector } = useWallet();

  return (
    <div className={s.wrapper}>
      <Sandbox walletSelector={walletSelector} />
    </div>
  );
}
