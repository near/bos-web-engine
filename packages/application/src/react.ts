import React, { type FunctionComponent } from 'react';

import { deserializeProps } from './container';
import type {
  CreateChildElementParams,
  CreateElementParams,
  ComponentDOMElement,
} from './types';

const secureCreateElement = (
  type: string | FunctionComponent,
  props: object,
  ...children: any
): ComponentDOMElement | null => {
  if (type === 'script') {
    return null;
  }

  return React.createElement(type, props, ...children);
};

function isChildrenAllowed(elementType: string) {
  return !(elementType in ['img']);
}

export function createElement({
  children,
  id,
  props,
  type,
  onMessageSent,
}: CreateElementParams): ComponentDOMElement | null {
  return secureCreateElement(
    type,
    deserializeProps({ id, props, onMessageSent }),
    isChildrenAllowed(type) ? children : undefined
  );
}

export function createChildElements({
  children,
  depth,
  index,
  parentId,
  onMessageSent,
}: CreateChildElementParams): any {
  // `children` is a literal
  if (typeof children === 'string' || typeof children === 'number') {
    return children;
  }

  // `children` is (non-zero) falsy or an empty object
  if (
    !children ||
    (typeof children === 'object' && Object.keys(children).length === 0)
  ) {
    return '';
  }

  // `children` is a single component
  if (children.type) {
    const {
      type,
      props: { children: subChildren, ...props },
    } = children;
    const childProps = {
      ...deserializeProps({ id: parentId, props, onMessageSent }),
      key: `${parentId}-${depth}-${index}`,
    };

    if (
      !subChildren ||
      !subChildren.filter((c: any) => c !== undefined).length
    ) {
      return secureCreateElement(type, childProps);
    }

    return secureCreateElement(
      type,
      childProps,
      createChildElements({
        children: subChildren,
        depth: depth + 1,
        index,
        parentId,
        onMessageSent,
      })
    );
  }

  // `children` is an array of components and/or primitives
  return children.map((child: any, i: number) =>
    createChildElements({
      children: child,
      depth: depth + 1,
      index: i,
      parentId,
      onMessageSent,
    })
  );
}
