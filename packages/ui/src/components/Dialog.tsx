import { X } from '@phosphor-icons/react';
import * as Dialog from '@radix-ui/react-dialog';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

import s from './Dialog.module.css';

type ContentProps = ComponentProps<typeof Dialog.Content> & {
  hideCloseButton?: boolean;
  size?: 'xs' | 's' | 'm' | 'l';
};

export const Root = Dialog.Root;
export const Portal = Dialog.Portal;

export const Content = forwardRef<HTMLDivElement, ContentProps>(
  ({ children, hideCloseButton, size = 'm', ...props }, ref) => {
    return (
      <Dialog.Overlay className={s.overlay}>
        <Dialog.Content
          className={s.content}
          data-size={size}
          ref={ref}
          {...props}
        >
          {!hideCloseButton && <CloseButton />}

          <div className={s.innerContent}>{children}</div>
        </Dialog.Content>
      </Dialog.Overlay>
    );
  }
);
Content.displayName = 'Content';

export const CloseButton = () => {
  return (
    <Dialog.Close className={s.closeButton}>
      <X weight="bold" />
    </Dialog.Close>
  );
};
