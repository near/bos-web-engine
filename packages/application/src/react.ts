import React from 'react';

import type {
  CreateChildElementOptions,
  CreateElementOptions,
  WidgetDOMElement,
} from './types';
import { deserializeProps } from './widget-container';

export function createElement({ children, id, props, type }: CreateElementOptions): WidgetDOMElement {
  return React.createElement(type, deserializeProps({ id, props }), children);
}

export function createChildElements({ children, depth, index, parentId }: CreateChildElementOptions): any {
  // `children` is a literal
  if (typeof children === 'string' || typeof children === 'number') {
    return children;
  }

  // `children` is (non-zero) falsy
  if (!children) {
    return '';
  }

  // `children` is a single component
  if (children.type) {
    const { type, props: { children: subChildren, ...props } } = children;
    const childProps = {
      ...deserializeProps({ id: parentId, props }),
      key: `${parentId}-${depth}-${index}`,
    };

    if (!subChildren || !subChildren.filter((c: any) => c !== undefined).length) {
      return React.createElement(type, childProps);
    }

    return React.createElement(type, childProps, createChildElements({
      children: subChildren,
      depth: depth + 1,
      index,
      parentId,
    }));
  }

  // `children` is an array of components and/or primitives
  return children.map((child: any, i: number) => createChildElements({
    children: child,
    depth: depth + 1,
    index: i,
    parentId,
  }));
}
