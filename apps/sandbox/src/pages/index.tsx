import { Sandbox } from '@bos-web-engine/sandbox';

import { useQueryParams } from '@/hooks/useQueryParams';
import s from '@/styles/home.module.css';

export default function Home() {
  const { queryParams } = useQueryParams();

  return (
    <div className={s.wrapper}>
      <Sandbox
        height="calc(100vh - var(--gateway-header-height))"
        queryParams={queryParams}
      />
    </div>
  );
}
