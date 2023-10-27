import type { Props } from '@bos-web-engine/common';

import type {
  DeserializePropsCallback,
  SerializePropsCallback,
  SerializeArgsCallback,
  SerializeNodeCallback,
} from './types';
import { ComposeSerializationMethodsCallback } from './types';

export interface BuildComponentIdParams {
  instanceId: string | undefined;
  componentPath: string;
  parentComponentId: string;
}

interface SerializeChildComponentParams {
  parentId: string;
  props: Props;
}

interface SerializedPropsCallback {
  componentId: string;
  callbackIdentifier: string;
}

interface DeepTransformParams {
  value: any;
  onString?: (s: string) => string;
  onFunction?: (f: Function, path: string) => any;
  onSerializedCallback?: (cb: SerializedPropsCallback) => any;
}

/**
 * Compose the set of serialization methods for the given container context
 * @param buildRequest Method for building callback requests
 * @param builtinComponents Set of builtin BOS Web Engine Components
 * @param callbacks Component container's callbacks
 * @param parentContainerId ID of the parent container
 * @param postCallbackInvocationMessage Request invocation on external Component via window.postMessage
 * @param requests Set of current callback requests
 */
export const composeSerializationMethods: ComposeSerializationMethodsCallback =
  ({
    buildRequest,
    callbacks,
    isComponent,
    parentContainerId,
    postCallbackInvocationMessage,
    requests,
  }) => {
    const isSerializedCallback = (o: any) =>
      !!o &&
      typeof o === 'object' &&
      Object.keys(o).length === 2 &&
      'callbackIdentifier' in o &&
      'componentId' in o;

    const deepTransform = ({
      value,
      onString,
      onFunction,
      onSerializedCallback,
    }: DeepTransformParams) => {
      const transform = (v: any, path: string): any => {
        if (!v) {
          return v;
        }

        if (
          isSerializedCallback(v) &&
          typeof onSerializedCallback === 'function'
        ) {
          return onSerializedCallback(v);
        }

        const isCollection = Array.isArray(v); // TODO handle other collections
        if (isCollection) {
          return v.map((i: any, idx: number) =>
            transform(i, `${path}[${idx}]`)
          );
        }

        if (typeof v === 'object') {
          return Object.fromEntries(
            Object.entries(v).map(([k, w]) => [k, transform(w, `${path}.${k}`)])
          );
        }

        if (typeof v === 'string' && typeof onString === 'function') {
          return onString(v);
        }

        if (typeof v === 'function' && typeof onFunction === 'function') {
          return onFunction(v, path);
        }

        return v;
      };

      return transform(value, '');
    };

    /**
     * Serialize props of a child Component to be rendered in the outer application
     * @param componentId The target Component ID
     * @param parentId Component's parent container
     * @param props The props for this container's Component
     */
    const serializeProps: SerializePropsCallback = ({
      componentId,
      parentId,
      props,
    }) => {
      return Object.entries(props).reduce(
        (newProps, [key, value]: [string, any]) => {
          // TODO better preact component check
          const isComponent =
            value?.props &&
            typeof value === 'object' &&
            '__' in value &&
            '__k' in value;
          const isProxy = value?.__bweMeta?.isProxy || false;

          const serializeCallback = (functionName: string, fn: Function) => {
            // [componentId] only applies to props on components, use method
            // body to distinguish between non-component callbacks
            const fnKey = [
              functionName,
              componentId || fn.toString().replace(/\\n/g, ''),
              parentId,
            ].join('::');

            callbacks[fnKey] = fn;

            if (componentId) {
              return {
                callbackIdentifier: fnKey,
                componentId: parentId,
              };
            }

            if (!newProps.__domcallbacks) {
              newProps.__domcallbacks = {};
            }

            newProps.__domcallbacks[functionName] = {
              callbackIdentifier: fnKey,
            };

            return newProps.__domcallbacks[functionName];
          };

          if (typeof value === 'function') {
            newProps[key] = serializeCallback(key, value);
          } else {
            let serializedValue = value;
            if (isComponent) {
              newProps[key] = serializeNode({
                childComponents: [],
                node: value,
                parentId,
              });
            } else if (isProxy) {
              newProps[key] = { ...serializedValue };
            } else {
              newProps[key] = deepTransform({
                value: serializedValue,
                onFunction: (fn: Function, path: string) =>
                  serializeCallback(`${key}${path}`, fn),
              });
            }
          }

          return newProps;
        },
        {} as Props
      );
    };

    const serializeArgs: SerializeArgsCallback = ({
      args,
      callbacks,
      componentId,
    }) => {
      return (args || []).map((arg) => {
        if (!arg) {
          return arg;
        }

        if (Array.isArray(arg)) {
          return serializeArgs({ args: arg, callbacks, componentId });
        }

        if (typeof arg === 'object') {
          const argKeys = Object.keys(arg);
          return Object.fromEntries(
            serializeArgs({
              args: Object.values(arg),
              callbacks,
              componentId,
            }).map((value, i) => [argKeys[i], value])
          );
        }

        if (typeof arg !== 'function') {
          return arg;
        }

        const callbackBody = arg.toString().replace(/\\n/g, '');
        const fnKey = callbackBody + '::' + componentId;
        callbacks[fnKey] = arg;
        return {
          callbackIdentifier: fnKey,
        };
      });
    };

    const deserializePropsCallback = ({
      componentId,
      callbackIdentifier,
    }: SerializedPropsCallback) => {
      return (...args: any) => {
        if (!parentContainerId) {
          console.error('Root Component cannot invoke method on parent');
          return;
        }

        const requestId = window.crypto.randomUUID();
        requests[requestId] = buildRequest();

        // any function arguments are closures in this child component scope
        // and must be cached in the component iframe
        postCallbackInvocationMessage({
          args,
          callbacks,
          componentId,
          method: callbackIdentifier,

          requestId,
          serializeArgs,
          targetId: parentContainerId,
        });

        return requests[requestId].promise;
      };
    };

    const deserializeProps: DeserializePropsCallback = ({
      componentId,
      props,
    }) => {
      if (!props || Array.isArray(props) || typeof props !== 'object') {
        return props;
      }

      return deepTransform({
        value: props,
        onSerializedCallback: (cb) =>
          deserializePropsCallback({
            componentId,
            callbackIdentifier: cb.callbackIdentifier,
          }),
      });
    };

    function buildComponentId({
      instanceId,
      componentPath,
      parentComponentId,
    }: BuildComponentIdParams) {
      // TODO warn on missing instanceId (<Component>'s id prop) here?
      return [componentPath, instanceId?.toString(), parentComponentId].join(
        '##'
      );
    }

    /**
     * Serialize a sandboxed <Component /> component
     * @param parentId ID of the parent Component
     * @param props Props passed to the <Component /> component
     */
    const serializeChildComponent = ({
      parentId,
      props,
    }: SerializeChildComponentParams) => {
      const { id: instanceId, src, props: componentProps, trust } = props;
      const componentId = buildComponentId({
        instanceId,
        componentPath: src,
        parentComponentId: parentId,
      });

      let child;
      try {
        child = {
          trust,
          props: componentProps
            ? serializeProps({
                props: componentProps,
                parentId,
                componentId,
              })
            : {},
          source: src,
          componentId,
        };
      } catch (error) {
        console.warn(`failed to dispatch component load for ${parentId}`, {
          error,
          componentProps,
        });
      }

      return {
        child,
        placeholder: {
          type: 'div',
          props: {
            id: 'dom-' + componentId,
            __bweMeta: {
              componentId: componentId,
            },
            className: 'container-child',
          },
        },
      };
    };

    /**
     * Given a Preact node, build its Component tree and serialize for transmission
     * @param childComponents Set of descendant Components accumulated across recursive invocations
     * @param node The Preact Component to serialize
     * @param parentId Component's parent container
     */
    const serializeNode: SerializeNodeCallback = ({
      node,
      childComponents,
      parentId,
    }) => {
      if (!node || typeof node !== 'object') {
        return node;
      }

      const { type } = node;
      let serializedElementType = typeof type === 'string' ? type : '';
      const children = node?.props?.children || [];
      let props = { ...node.props };
      delete props.children;

      let unifiedChildren = Array.isArray(children) ? children : [children];

      unifiedChildren
        .filter(
          (child) =>
            child && typeof child === 'object' && 'childComponents' in child
        )
        .forEach((child) => {
          child.childComponents.forEach((childComponent: any) =>
            childComponents.push(childComponent)
          );
        });

      if (typeof type === 'function') {
        if (!isComponent(type)) {
          throw new Error(`unrecognized Component function ${type.name}`);
        }

        const { child, placeholder } = serializeChildComponent({
          parentId,
          props,
        });

        if (child) {
          childComponents.push(child);
        }

        return placeholder;
      }

      return {
        type: serializedElementType,
        props: {
          ...serializeProps({
            props,
            parentId,
          }),
          children: unifiedChildren.flat().map((c) =>
            c?.props
              ? serializeNode({
                  node: c,
                  childComponents,
                  parentId,
                })
              : c
          ),
        },
        childComponents,
      };
    };

    return {
      deserializeProps,
      serializeArgs,
      serializeNode,
    };
  };
