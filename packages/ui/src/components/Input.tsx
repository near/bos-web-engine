import { InputHTMLAttributes, forwardRef } from 'react';

import s from './Input.module.css';
import { Spinner } from './Spinner';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  loading?: boolean;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className = '', invalid, loading, type = 'text', ...props }, ref) => {
    return (
      <div className={`${s.wrapper} ${className}`} data-loading={loading}>
        <input
          type={type}
          className={s.input}
          ref={ref}
          aria-invalid={invalid}
          {...props}
        />

        <div className={s.spinner}>
          <Spinner size="1rem" />
        </div>
      </div>
    );
  }
);
Input.displayName = 'Input';
