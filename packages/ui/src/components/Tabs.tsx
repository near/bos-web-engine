import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { useEffect, useRef } from 'react';

import s from './Tabs.module.css';
import { mergeRefs } from '../utils/merge-refs';

type RootProps = ComponentProps<typeof TabsPrimitive.Root>;

type TriggerProps = ComponentProps<typeof TabsPrimitive.Trigger> & {
  href?: string;
};

type ListProps = ComponentProps<typeof TabsPrimitive.List>;
export const List = forwardRef<HTMLDivElement, ListProps>(
  ({ className, ...props }, ref) => {
    return (
      <TabsPrimitive.List
        className={`${s.tabList} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
List.displayName = 'List';

type ContentProps = ComponentProps<typeof TabsPrimitive.Content>;
export const Content = forwardRef<HTMLDivElement, ContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <TabsPrimitive.Content
        className={`${s.tabContent} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Content.displayName = 'Content';

export const Root = forwardRef<HTMLDivElement, RootProps>(
  ({ value, className, ...props }, ref) => {
    const elementRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const target = elementRef.current?.querySelector(
        '[data-state="active"]'
      ) as HTMLButtonElement;
      const list = elementRef.current?.querySelector(
        '[role="tablist"]'
      ) as HTMLDivElement;
      if (target && list) {
        list.scrollLeft = target.offsetLeft - 25;
      }
    }, [value]);

    return (
      <TabsPrimitive.Root
        className={`${s.tabRoot} ${className}`}
        value={value}
        ref={mergeRefs([ref, elementRef])}
        {...props}
      />
    );
  }
);
Root.displayName = 'Root';

export const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(
  ({ href, ...props }, ref) => {
    const elementRef = useRef<HTMLButtonElement | null>(null);

    // ! not currently supported but may be useful in future
    // const router = useRouter();

    // useEffect(() => {
    //   if (href) {
    //     router.prefetch(href);
    //   }
    // }, [href, router]);

    // useEffect(() => {
    //   function onClick(event: MouseEvent) {
    //     if (href) {
    //       if (event.metaKey || event.ctrlKey) {
    //         window.open(href, '_blank');
    //       } else {
    //         router.push(href);
    //       }
    //     }
    //   }

    //   const el = elementRef.current;
    //   el?.addEventListener('click', onClick);

    //   return () => {
    //     el?.removeEventListener('click', onClick);
    //   };
    // }, [href, router]);

    return (
      <TabsPrimitive.Trigger
        className={s.tabTrigger}
        ref={mergeRefs([ref, elementRef])}
        {...props}
      />
    );
  }
);
Trigger.displayName = 'Trigger';
