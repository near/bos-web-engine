import type { CSSProperties } from 'react';

import s from './HR.module.css';

type Props = {
  style?: CSSProperties;
};

export const HR = (props: Props) => {
  return <hr className={s.hr} {...props} />;
};
