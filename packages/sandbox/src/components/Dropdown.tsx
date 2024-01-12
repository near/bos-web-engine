import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import styled from 'styled-components';

import { useSandboxStore } from '../hooks/useSandboxStore';

export const Root = DropdownMenuPrimitive.Root;
export const Trigger = DropdownMenuPrimitive.Trigger;
export const Portal = DropdownMenuPrimitive.Portal;

const ContentStyled = styled(DropdownMenuPrimitive.Content)`
  z-index: 1000;
  min-width: 8rem;
  max-width: 100vw;
  background-color: var(--color-surface-4);
  border-radius: 0.2rem;
  padding: 0.25rem;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.25);

  hr {
    margin: 0.5rem 0;
  }
`;

const ArrowStyled = styled(DropdownMenuPrimitive.Arrow)`
  fill: var(--color-surface-4);
`;

const ItemStyled = styled(DropdownMenuPrimitive.Item)`
  all: unset;
  color: var(--color-text-1);
  border-radius: 0.1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.3rem 0.75rem;
  font-family: var(--font-primary);
  font-size: 0.8rem;
  line-height: 1.4;
  font-weight: 400;
  position: relative;
  user-select: none;
  outline: none;
  cursor: pointer;

  &[data-highlighted] {
    background-color: var(--color-surface-3);
  }
`;

export const Content = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof DropdownMenuPrimitive.Content>
>(({ children, ...props }, ref) => {
  const containerId = useSandboxStore((store) => store.id);

  return (
    <DropdownMenuPrimitive.Portal
      container={containerId ? document.getElementById(containerId) : undefined}
    >
      <ContentStyled sideOffset={0} ref={ref} {...props}>
        {children}
        <ArrowStyled />
      </ContentStyled>
    </DropdownMenuPrimitive.Portal>
  );
});
Content.displayName = 'Content';

export const Item = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof DropdownMenuPrimitive.Item>
>((props, ref) => {
  return <ItemStyled ref={ref} {...props} />;
});
Item.displayName = 'Item';
