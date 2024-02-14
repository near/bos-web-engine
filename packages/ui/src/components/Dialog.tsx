import { X } from '@phosphor-icons/react';
import * as Dialog from '@radix-ui/react-dialog';
import type { ComponentProps, HTMLAttributes } from 'react';
import { forwardRef } from 'react';

import s from './Dialog.module.css';

type ContentProps = ComponentProps<typeof Dialog.Content> & {
  anchor?: 'center' | 'top';
  hideCloseButton?: boolean;
  size?: 'xs' | 's' | 'm' | 'l';
};

type HeaderProps = HTMLAttributes<HTMLDivElement>;

type CloseButtonProps = ComponentProps<typeof Dialog.Close> & {
  absolute?: boolean;
};

export const Root = Dialog.Root;
export const Portal = Dialog.Portal;

export const Content = forwardRef<HTMLDivElement, ContentProps>(
  (
    { anchor = 'center', children, hideCloseButton, size = 'm', ...props },
    ref
  ) => {
    return (
      <Dialog.Overlay className={s.overlay}>
        <Dialog.Content
          className={s.content}
          data-anchor={anchor}
          data-size={size}
          ref={ref}
          {...props}
        >
          {!hideCloseButton && <CloseButton absolute />}

          <div className={s.innerContent}>{children}</div>
        </Dialog.Content>
      </Dialog.Overlay>
    );
  }
);
Content.displayName = 'Content';

export const StickyHeader = forwardRef<HTMLDivElement, HeaderProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div className={`${s.stickyHeader} ${className}`} {...props} ref={ref} />
    );
  }
);
StickyHeader.displayName = 'StickyHeader';

export const CloseButton = ({
  absolute,
  className = '',
  ...props
}: CloseButtonProps) => {
  return (
    <Dialog.Close
      className={`${s.closeButton} ${className}`}
      data-absolute={absolute}
      {...props}
    >
      <X weight="bold" />
    </Dialog.Close>
  );
};
