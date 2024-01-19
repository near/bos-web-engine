import * as Primitive from '@radix-ui/react-tooltip';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import styled from 'styled-components';

type RootProps = Omit<ComponentProps<typeof Primitive.Root>, 'children'>;

type Props = Omit<ComponentProps<typeof Primitive.Content>, 'content'> & {
  children: ReactElement;
  container?: HTMLElement | null;
  content: ReactNode;
  root?: RootProps;
};

const Content = styled(Primitive.Content)`
  color: var(--color-text-1);
  border-radius: 0.25rem;
  padding: 0.3rem 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-surface-primary);
  z-index: 1000;
  max-width: 20rem;
  font-size: 0.8rem;
  line-height: 1.5;
  word-break: break-word;
  font-family: sans-serif;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.325);
`;

const Arrow = styled(Primitive.Arrow)`
  fill: var(--color-surface-primary);
`;

export function Tooltip({
  children,
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
          <Content side={side} sideOffset={sideOffset} {...props}>
            {content}
            <Arrow offset={6} />
          </Content>
        </Primitive.Portal>
      </Primitive.Root>
    </Primitive.Provider>
  );
}
