import { Sandbox } from '@bos-web-engine/sandbox';
import s from '@/styles/home.module.css';

export default function Home() {
  // TODO: Pass walletSelector to <Sandbox />
  // const { walletSelector } = useWallet();

  return (
    <div className={s.wrapper}>
      <Sandbox />
    </div>
  );
}
