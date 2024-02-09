import type { Props, SerializedNode } from '@bos-web-engine/common';

import type {
  ComposeSerializationMethodsCallback,
  DeserializePropsCallback,
  SerializePropsCallback,
  SerializeArgsCallback,
  SerializeNodeCallback,
  DeserializeArgsCallback,
  Node,
} from './types';

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
  containerId: string;
  callbackIdentifier: string;
}

interface DeepTransformParams {
  value: any;
  onString?: (s: string) => string;
  onFunction?: (f: Function, path: string) => any;
  onNode?: (n: Node) => SerializedNode;
  onSerializedCallback?: (cb: SerializedPropsCallback) => Function;
}

interface BuildContainerMethodIdentifierParams {
  callback: Function;
  callbackName: string;
  componentId?: string;
  containerId: string;
}

/**
 * Compose the set of serialization methods for the given container context
 * @param buildRequest Method for building callback requests
 * @param builtinComponents Set of builtin BOS Web Engine Components
 * @param callbacks Component container's callbacks
 * @param postCallbackInvocationMessage Request invocation on external Component via window.postMessage
 * @param requests Set of current callback requests
 */
export const composeSerializationMethods: ComposeSerializationMethodsCallback =
  ({
    buildRequest,
    callbacks,
    isComponent,
    postCallbackInvocationMessage,
    requests,
  }) => {
    const isSerializedCallback = (o: any) =>
      !!o &&
      typeof o === 'object' &&
      Object.keys(o).length === 2 &&
      'callbackIdentifier' in o &&
      'containerId' in o;

    // TODO better preact component check
    const isPreactNode = (value: any) =>
      !!value?.props &&
      typeof value === 'object' &&
      '__' in value &&
      '__k' in value;

    const deepTransform = ({
      value,
      onString,
      onFunction,
      onNode,
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

        if (isPreactNode(v)) {
          if (typeof onNode !== 'function') {
            // Preact nodes have self-referencing properties, return here to stop traversing
            return v;
          }

          return onNode(v);
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

    const buildContainerMethodIdentifier = ({
      callback,
      callbackName,
      componentId,
      containerId,
    }: BuildContainerMethodIdentifierParams) =>
      [
        containerId,
        callback.toString().replace(/\s+/g, ''),
        callbackName,
        componentId,
      ].join('::');

    /**
     * Serialize props of a child Component to be rendered in the outer application
     * @param containerId Component's parent container
     * @param props The props for this container's Component
     */
    const serializeProps: SerializePropsCallback = ({
      componentId,
      containerId,
      props,
    }) => {
      return Object.entries(props).reduce(
        (newProps, [key, value]: [string, any]) => {
          const isProxy = value?.__bweMeta?.isProxy || false;

          const serializeCallback = (
            callbackName: string,
            callback: Function
          ) => {
            const fnKey = buildContainerMethodIdentifier({
              callback,
              callbackName,
              componentId,
              containerId,
            });

            callbacks[fnKey] = callback;

            return {
              callbackIdentifier: fnKey,
              containerId,
            };
          };

          if (typeof value === 'function') {
            newProps[key] = serializeCallback(key, value);
          } else {
            let serializedValue = value;
            if (isPreactNode(value)) {
              newProps[key] = serializeNode({
                childComponents: [],
                node: value,
                parentId: containerId,
              });
            } else if (isProxy) {
              newProps[key] = { ...serializedValue };
            } else {
              newProps[key] = deepTransform({
                value: serializedValue,
                onFunction: (fn: Function, path: string) =>
                  serializeCallback(`${key}${path}`, fn),
                onNode: (node) =>
                  serializeNode({
                    node,
                    childComponents: [],
                    parentId: containerId,
                  }),
              });
            }
          }

          return newProps;
        },
        {} as Props
      );
    };

    const deserializeArgs: DeserializeArgsCallback = ({
      args,
      containerId,
    }) => {
      return deepTransform({
        value: args,
        onSerializedCallback: (cb) => {
          return deserializePropsCallback({
            containerId,
            callbackIdentifier: cb.callbackIdentifier,
          });
        },
      });
    };

    const serializeArgs: SerializeArgsCallback = ({
      args,
      callbacks,
      containerId,
    }) => {
      return (args || []).map((arg) => {
        if (!arg) {
          return arg;
        }

        if (Array.isArray(arg)) {
          return serializeArgs({ args: arg, callbacks, containerId });
        }

        if (typeof arg === 'object') {
          const argKeys = Object.keys(arg);
          return Object.fromEntries(
            serializeArgs({
              args: Object.values(arg),
              callbacks,
              containerId,
            }).map((value, i) => [argKeys[i], value])
          );
        }

        if (typeof arg !== 'function') {
          return arg;
        }

        const fnKey = buildContainerMethodIdentifier({
          callback: arg,
          callbackName: arg?.name, // FIXME
          containerId,
        });

        callbacks[fnKey] = arg;
        return {
          callbackIdentifier: fnKey,
          containerId,
        };
      });
    };

    const deserializePropsCallback = ({
      containerId,
      callbackIdentifier,
    }: SerializedPropsCallback) => {
      return (...args: any) => {
        const requestId = window.crypto.randomUUID();
        requests[requestId] = buildRequest();

        // any function arguments are closures in this child component scope
        // and must be cached in the component iframe
        postCallbackInvocationMessage({
          args,
          callbacks,
          containerId,
          method: callbackIdentifier,
          requestId,
          serializeArgs,
          targetId: callbackIdentifier.split('::')[0],
        });

        return requests[requestId].promise;
      };
    };

    const deserializeProps: DeserializePropsCallback = ({
      containerId,
      props,
    }) => {
      if (!props || Array.isArray(props) || typeof props !== 'object') {
        return props;
      }

      return deepTransform({
        value: props,
        onSerializedCallback: (cb) => {
          return deserializePropsCallback({
            containerId,
            callbackIdentifier: cb.callbackIdentifier,
          });
        },
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
                componentId,
                containerId: parentId,
                props: componentProps,
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
              componentId,
            },
            className: 'container-child',
            'data-component-src': src,
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
            containerId: parentId,
            props,
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
      deserializeArgs,
      deserializeProps,
      serializeArgs,
      serializeNode,
    };
  };
