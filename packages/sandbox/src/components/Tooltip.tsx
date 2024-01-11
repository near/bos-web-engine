import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import styled from 'styled-components';

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
  --background-color: #000;
  color: #fff;
  border-radius: 0.25rem;
  padding: 0.3rem 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--background-color);
  z-index: 1000;
  max-width: 20rem;
  line-height: 1.5;
  word-break: break-word;
  font-size: 0.8rem;
  font-family: sans-serif;
`;

const Arrow = styled(TooltipPrimitive.Arrow)`
  fill: var(--background-color);
`;

export function Tooltip({
  children,
  content,
  root,
  side = 'top',
  sideOffset = 6,
  ...props
}: Props) {
  const delayDuration = root?.delayDuration || 200;

  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root delayDuration={delayDuration} {...root}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>

        <TooltipPrimitive.Portal>
          <Content side={side} sideOffset={sideOffset} {...props}>
            {content}
            <Arrow offset={6} />
          </Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
