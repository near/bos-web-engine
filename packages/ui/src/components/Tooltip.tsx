import * as Primitive from '@radix-ui/react-tooltip';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

import s from './Tooltip.module.css';

type RootProps = Omit<ComponentProps<typeof Primitive.Root>, 'children'>;

type Props = Omit<ComponentProps<typeof Primitive.Content>, 'content'> & {
  children: ReactElement;
  container?: HTMLElement | null;
  content: ReactNode;
  root?: RootProps;
};

export function Tooltip({
  children,
  className = '',
  container,
  content,
  root = { disableHoverableContent: true },
  side = 'top',
  sideOffset = 3,
  ...props
}: Props) {
  const delayDuration = root?.delayDuration || 300;

  return (
    <Primitive.Provider>
      <Primitive.Root delayDuration={delayDuration} {...root}>
        <Primitive.Trigger asChild>{children}</Primitive.Trigger>

        <Primitive.Portal container={container}>
          <Primitive.Content
            side={side}
            sideOffset={sideOffset}
            {...props}
            className={`${s.content} ${className}`}
          >
            {content}
            <Primitive.Arrow className={s.arrowBorder} />
            <Primitive.Arrow className={s.arrowFill} />
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </Primitive.Provider>
  );
}
