import type {
  BOSComponentProps,
  ComponentChildMetadata,
  ComponentTrust,
  Props,
  SerializedNode,
} from '@bos-web-engine/common';

import type {
  BWEComponentNode,
  ComposeSerializationMethodsCallback,
  DeserializeArgsCallback,
  DeserializePropsCallback,
  Node,
  SerializeArgsCallback,
  SerializeNodeCallback,
  SerializePropsCallback,
} from './types';

export interface BuildComponentIdParams {
  instanceId: string | undefined;
  componentPath: string;
  parentComponentId: string;
}

interface SerializeChildComponentParams {
  parentId: string;
  node: BWEComponentNode;
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
 * @param callbacks Component container's callbacks
 * @param initExternalCallbackInvocation Initialize callback invocation request
 * @param postCallbackInvocationMessage Request invocation on external Component via window.postMessage
 */
export const composeSerializationMethods: ComposeSerializationMethodsCallback =
  ({
    callbacks,
    initExternalCallbackInvocation,
    isComponent,
    postCallbackInvocationMessage,
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
     * Mark kebab keys as duplicates when they exist as camel cased on props
     * TODO find where do these come from
     * @param key props key
     * @param props Component props
     */
    const isDuplicateKey = (key: string, props: any) => {
      if (!key.includes('-')) {
        return false;
      }

      return (
        key
          .split('-')
          .reduce(
            (propKey, word, i) =>
              `${propKey}${
                i ? `${word[0].toUpperCase()}${word.slice(1)}` : word
              }`,
            ''
          ) in props
      );
    };

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
          if (key === 'class' || isDuplicateKey(key, props)) {
            return newProps;
          }

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
            if (isPreactNode(value)) {
              newProps[key] = serializeNode({
                childComponents: [],
                node: value,
                parentId: containerId,
              });
            } else {
              newProps[key] = deepTransform({
                value,
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

    const serializeArgs: SerializeArgsCallback = ({ args, containerId }) => {
      return (args || []).map((arg) => {
        if (!arg) {
          return arg;
        }

        if (Array.isArray(arg)) {
          return serializeArgs({ args: arg, containerId });
        }

        if (typeof arg === 'object') {
          const argKeys = Object.keys(arg);
          return Object.fromEntries(
            serializeArgs({
              args: Object.values(arg),
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
        const { invocationId, invocation } = initExternalCallbackInvocation();

        // any function arguments are closures in this child component scope
        // and must be cached in the component iframe
        postCallbackInvocationMessage({
          args,
          containerId,
          method: callbackIdentifier,
          requestId: invocationId,
          serializeArgs,
          targetId: callbackIdentifier.split('::')[0],
        });

        return invocation;
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
      // TODO warn on missing instanceId (<Component>'s key prop) here?
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
      node,
    }: SerializeChildComponentParams): {
      child: ComponentChildMetadata;
      placeholder: SerializedNode;
    } => {
      const {
        key: instanceId,
        props: { bwe, ...componentProps },
      } = node;
      const { src, trust } = bwe;

      const componentId = buildComponentId({
        instanceId,
        componentPath: src!,
        parentComponentId: parentId,
      });

      return {
        child: {
          trust: trust || ({ mode: 'sandboxed' } as ComponentTrust),
          props: componentProps
            ? serializeProps({
                componentId,
                containerId: parentId,
                props: componentProps,
              })
            : {},
          source: src!,
          componentId,
        },
        placeholder: {
          type: 'div',
          props: {
            id: 'dom-' + componentId,
            bwe: {
              componentId,
            },
            className: 'container-child',
            'data-component-src': src!,
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
      const props = { ...node.props } as BOSComponentProps;
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

        const componentNode = { ...node, props } as BWEComponentNode;
        const { child, placeholder } = serializeChildComponent({
          parentId,
          node: componentNode,
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
