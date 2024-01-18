import { Circle, CheckCircle } from '@phosphor-icons/react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type { ComponentProps, ReactNode } from 'react';
import { forwardRef } from 'react';
import styled, { css } from 'styled-components';

import { useSandboxStore } from '../hooks/useSandboxStore';

export const Root = DropdownMenuPrimitive.Root;
export const Trigger = DropdownMenuPrimitive.Trigger;
export const RadioGroup = DropdownMenuPrimitive.RadioGroup;

const ContentStyled = styled(DropdownMenuPrimitive.Content)`
  z-index: 1000;
  min-width: 8rem;
  max-width: min(25rem, 100vw);
  max-height: 80vh;
  background-color: var(--color-surface-4);
  border-radius: 0.2rem;
  padding: 0.25rem;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.25);
  overflow: auto;
  scroll-behavior: smooth;

  hr {
    margin: 0.5rem 0.5rem;
    border: none;
    border-top: 1px solid var(--color-border-1);
  }
`;

const ArrowStyled = styled(DropdownMenuPrimitive.Arrow)`
  fill: var(--color-surface-4);
`;

const itemCss = css`
  all: unset;
  color: var(--color-text-1);
  border-radius: 0.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.3rem 0.5rem;
  font-family: var(--font-primary);
  font-size: 0.8rem;
  line-height: 1.4;
  font-weight: 400;
  position: relative;
  user-select: none;
  outline: none;
  cursor: pointer;
  overflow-wrap: anywhere;

  &[data-highlighted] {
    background-color: var(--color-surface-3);
  }
`;

const CheckboxItemStyled = styled(DropdownMenuPrimitive.CheckboxItem)`
  ${itemCss}
`;
const ItemStyled = styled(DropdownMenuPrimitive.Item)`
  ${itemCss}
`;
const RadioItemStyled = styled(DropdownMenuPrimitive.RadioItem)`
  ${itemCss}
`;

const StyledLabel = styled.p`
  padding: 0.3rem 0.5rem;
  font-family: var(--font-primary);
  font-size: 0.8rem;
  line-height: 1.4;
  font-weight: 400;
  color: var(--color-text-2);
`;

const StyledIndicator = styled.div`
  display: flex;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;

  svg {
    display: none;
    fill: currentColor;
  }

  [data-indicator='unchecked'] {
    display: block;
    opacity: 0.5;
  }

  [data-indicator='checked'] {
    opacity: 1;
    color: var(--color-affirm);
  }

  [data-state='checked'] & {
    [data-indicator='checked'] {
      display: block;
    }
    [data-indicator='unchecked'] {
      display: none;
    }
  }
`;

export const Content = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof DropdownMenuPrimitive.Content>
>(({ children, ...props }, ref) => {
  const containerElement = useSandboxStore((store) => store.containerElement);

  return (
    <DropdownMenuPrimitive.Portal container={containerElement}>
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

export const RadioItem = forwardRef<
  HTMLInputElement,
  ComponentProps<typeof DropdownMenuPrimitive.RadioItem>
>((props, ref) => {
  return <RadioItemStyled ref={ref} {...props} />;
});
RadioItem.displayName = 'RadioItem';

export const CheckboxItem = forwardRef<
  HTMLInputElement,
  ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>
>((props, ref) => {
  return <CheckboxItemStyled ref={ref} {...props} />;
});
CheckboxItem.displayName = 'CheckboxItem';

export function CheckedIndicator() {
  return (
    <StyledIndicator>
      <Circle data-indicator="unchecked" weight="bold" />
      <CheckCircle data-indicator="checked" weight="bold" />
    </StyledIndicator>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <StyledLabel>{children}</StyledLabel>;
}
