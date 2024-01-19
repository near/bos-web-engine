import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import styled from 'styled-components';

import { useSandboxStore } from '../hooks/useSandboxStore';

type RootProps = Omit<ComponentProps<typeof TooltipPrimitive.Root>, 'children'>;

type Props = Omit<
  ComponentProps<typeof TooltipPrimitive.Content>,
  'content'
> & {
  children: ReactElement;
  content: ReactNode;
  root?: RootProps;
};

const Content = styled(TooltipPrimitive.Content)`
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

const Arrow = styled(TooltipPrimitive.Arrow)`
  fill: var(--color-surface-primary);
`;

export function Tooltip({
  children,
  content,
  root = { disableHoverableContent: true },
  side = 'top',
  sideOffset = 3,
  ...props
}: Props) {
  const delayDuration = root?.delayDuration || 300;
  const containerElement = useSandboxStore((store) => store.containerElement);

  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root delayDuration={delayDuration} {...root}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>

        <TooltipPrimitive.Portal container={containerElement}>
          <Content side={side} sideOffset={sideOffset} {...props}>
            {content}
            <Arrow offset={6} />
          </Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
