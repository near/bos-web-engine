import { Sandbox } from '@bos-web-engine/sandbox';

import s from '@/styles/home.module.css';

export default function Home() {
  return (
    <div className={s.wrapper}>
      <Sandbox height="calc(100vh - var(--header-height))" />
    </div>
  );
}
