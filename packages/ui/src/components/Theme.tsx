import { HTMLAttributes } from 'react';

import s from './Theme.module.css';

type Props = HTMLAttributes<HTMLDivElement> & {
  includeDefaultStyles?: boolean;
};

export function Theme({
  className = '',
  includeDefaultStyles,
  ...props
}: Props) {
  return (
    <div
      className={`${s.theme} ${className} ${
        includeDefaultStyles ? s.defaults : ''
      }`}
      {...props}
    />
  );
}
