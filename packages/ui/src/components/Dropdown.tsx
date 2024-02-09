import { Circle, CheckCircle } from '@phosphor-icons/react';
import * as Primitive from '@radix-ui/react-dropdown-menu';
import type { ComponentProps, ReactNode } from 'react';
import { forwardRef } from 'react';

import s from './Dropdown.module.css';

export const Root = Primitive.Root;
export const Trigger = Primitive.Trigger;
export const RadioGroup = Primitive.RadioGroup;
export const Portal = Primitive.Portal;

export const Content = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof Primitive.Content>
>(({ children, className = '', ...props }, ref) => {
  return (
    <Primitive.Content
      className={`${s.content} ${className}`}
      sideOffset={0}
      ref={ref}
      {...props}
    >
      {children}
      <Primitive.Arrow className={s.arrowBorder} />
      <Primitive.Arrow className={s.arrowFill} />
    </Primitive.Content>
  );
});
Content.displayName = 'Content';

export const Item = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof Primitive.Item>
>(({ className = '', ...props }, ref) => {
  return (
    <Primitive.Item className={`${s.item} ${className}`} ref={ref} {...props} />
  );
});
Item.displayName = 'Item';

export const RadioItem = forwardRef<
  HTMLInputElement,
  ComponentProps<typeof Primitive.RadioItem>
>(({ className = '', ...props }, ref) => {
  return (
    <Primitive.RadioItem
      className={`${s.item} ${className}`}
      ref={ref}
      {...props}
    />
  );
});
RadioItem.displayName = 'RadioItem';

export const CheckboxItem = forwardRef<
  HTMLInputElement,
  ComponentProps<typeof Primitive.CheckboxItem>
>(({ className = '', ...props }, ref) => {
  return (
    <Primitive.CheckboxItem
      className={`${s.item} ${className}`}
      ref={ref}
      {...props}
    />
  );
});
CheckboxItem.displayName = 'CheckboxItem';

export function CheckedIndicator() {
  return (
    <div className={s.checkboxIndicator}>
      <Circle data-indicator="unchecked" weight="duotone" />
      <CheckCircle data-indicator="checked" weight="duotone" />
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <p className={s.label}>{children}</p>;
}
