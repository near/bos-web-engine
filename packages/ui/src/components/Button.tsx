import { AnchorHTMLAttributes, ButtonHTMLAttributes, forwardRef } from 'react';

import s from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className = '', loading, type = 'button', ...props }, ref) => {
    return (
      <button
        className={`${s.button} ${className}`}
        aria-busy={loading}
        {...props}
        ref={ref}
      >
        <span className={s.content}>{children}</span>
      </button>
    );
  }
);
Button.displayName = 'Button';

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <a className={`${s.button} ${className}`} {...props} ref={ref}>
        <span className={s.content}>{children}</span>
      </a>
    );
  }
);
ButtonLink.displayName = 'ButtonLink';
