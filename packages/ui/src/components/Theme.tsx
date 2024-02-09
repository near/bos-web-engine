import { HTMLAttributes } from 'react';

import s from './Theme.module.css';

type Props = HTMLAttributes<HTMLDivElement>;

export function Theme({ className = '', ...props }: Props) {
  return <div className={`${s.theme} ${className}`} {...props} />;
}
