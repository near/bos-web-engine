import { Circle, CheckCircle } from '@phosphor-icons/react';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import type { ComponentProps, ReactNode } from 'react';
import { forwardRef } from 'react';
import s from './Dropdown.module.css';

export const Root = Dropdown.Root;
export const Trigger = Dropdown.Trigger;
export const RadioGroup = Dropdown.RadioGroup;

export const Content = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof Dropdown.Content>
>(({ children, ...props }, ref) => {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        className={s.content}
        sideOffset={0}
        ref={ref}
        {...props}
      >
        {children}
        <Dropdown.Arrow className={s.arrow} />
      </Dropdown.Content>
    </Dropdown.Portal>
  );
});
Content.displayName = 'Content';

export const Item = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof Dropdown.Item>
>((props, ref) => {
  return <Dropdown.Item className={s.item} ref={ref} {...props} />;
});
Item.displayName = 'Item';

export const RadioItem = forwardRef<
  HTMLInputElement,
  ComponentProps<typeof Dropdown.RadioItem>
>((props, ref) => {
  return <Dropdown.RadioItem className={s.item} ref={ref} {...props} />;
});
RadioItem.displayName = 'RadioItem';

export const CheckboxItem = forwardRef<
  HTMLInputElement,
  ComponentProps<typeof Dropdown.CheckboxItem>
>((props, ref) => {
  return <Dropdown.CheckboxItem className={s.item} ref={ref} {...props} />;
});
CheckboxItem.displayName = 'CheckboxItem';

export function CheckedIndicator() {
  return (
    <div className={s.checkedIndicator}>
      <Circle className={s.uncheckedIndicatorSvg} weight="bold" />
      <CheckCircle className={s.checkedIndicatorSvg} weight="bold" />
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <p className={s.label}>{children}</p>;
}
