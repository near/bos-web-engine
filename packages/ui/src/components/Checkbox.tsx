import { Check } from '@phosphor-icons/react';
import { InputHTMLAttributes, forwardRef } from 'react';

import s from './Checkbox.module.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  type?: 'checkbox' | 'radio';
};

export const Checkbox = forwardRef<HTMLInputElement, Props>(
  ({ className = '', type = 'checkbox', ...props }, ref) => {
    return (
      <div className={`${s.checkbox} ${className}`}>
        <input type={type} {...props} ref={ref} />
        <Check weight="bold" />
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
