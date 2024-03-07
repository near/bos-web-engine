import s from './Button.module.css';
import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

function Button({ children = "Click Me", className = '', loading, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      className={`${s.button} ${className}`}
      aria-busy={loading}
      type={type}
      {...props}
    >
      <span className={s.content}>{children}</span>
    </button>
  );
}

export default Button as BWEComponent<ButtonProps>;