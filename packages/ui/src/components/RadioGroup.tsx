import { Circle, CheckCircle } from '@phosphor-icons/react';
import * as Primitive from '@radix-ui/react-radio-group';
import { forwardRef, type ComponentProps } from 'react';

import s from './RadioGroup.module.css';

export const Root = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof Primitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <Primitive.Root {...props} ref={ref} className={c(s.root, className)} />
  );
});
Root.displayName = 'Root';

export const Item = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof Primitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <Primitive.Item {...props} ref={ref} className={c(s.item, className)} />
  );
});
Item.displayName = 'Item';

export const Indicator = forwardRef<
  HTMLSpanElement,
  ComponentProps<typeof Primitive.Indicator>
>(({ className, ...props }, ref) => {
  return (
    <Primitive.Indicator
      {...props}
      ref={ref}
      className={c(s.indicator, className)}
    />
  );
});
Indicator.displayName = 'Indicator';

export function CheckedIndicator() {
  return (
    <div className={s.checkboxIndicator}>
      <Circle data-indicator="unchecked" weight="duotone" />
      <CheckCircle data-indicator="checked" weight="duotone" />
    </div>
  );
}

// generate className value w/ option module and override classes
// TODO port to other UI lib components in future
function c(a?: string, b?: string) {
  return [a, b].filter((x) => !!x).join(' ');
}
