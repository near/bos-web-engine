import { AnchorHTMLAttributes, ButtonHTMLAttributes, forwardRef } from 'react';

import s from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', type = 'button', ...props }, ref) => {
    return (
      <button className={`${s.button} ${className}`} {...props} ref={ref} />
    );
  }
);
Button.displayName = 'Button';

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className = '', ...props }, ref) => {
    return <a className={`${s.button} ${className}`} {...props} ref={ref} />;
  }
);
ButtonLink.displayName = 'ButtonLink';
