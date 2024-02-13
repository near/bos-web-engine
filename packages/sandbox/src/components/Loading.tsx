import { Spinner } from '@bos-web-engine/ui';

import s from './Loading.module.css';

type Props = {
  message?: string;
};

export function Loading({ message = 'Loading...' }: Props) {
  return (
    <div className={s.wrapper}>
      <Spinner size="3rem" />
      <p>{message}</p>
    </div>
  );
}
