import type {
  BuiltinProps,
  DeserializePropsOptions,
  FilesProps,
  InfiniteScrollProps,
  IpfsImageUploadProps,
  MarkdownProps,
  OverlayTriggerProps,
  Props,
  SerializeArgsOptions,
  SerializeNodeOptions,
  SerializePropsOptions,
  SerializedArgs,
  SerializedNode,
  TypeaheadProps,
} from './types';

export function encodeJsonString(value: string) {
  if (!value) {
    return value;
  }

  return value.toString()
    .replace(/\n/g, '⁣')
    .replace(/\t/g, '⁤');
}

export function decodeJsonString(value: string) {
  if (!value) {
    return value;
  }

  return value.toString()
    .replace(/⁣/g, '\n')
    .replace(/⁤/g, '\t');
}

export function serializeProps({ builtinComponents, callbacks, parentId, props, widgetId }: SerializePropsOptions): Props {
  return Object.entries(props)
    .reduce((newProps, [key, value]: [string, any]) => {
      // TODO better preact component check
      const isComponent = value?.props && typeof value === 'object' && ('__' in value && '__k' in value);
      const isFunction = typeof value === 'function';
      const isProxy = value?.__bweMeta?.isProxy || false;

      if (!isFunction) {
        let serializedValue = value;
        if (isComponent) {
          serializedValue = serializeNode({
            builtinComponents,
            callbacks,
            childWidgets: [],
            index: 0,
            node: value,
            parentId,
          });
        } else if (typeof value === 'string') {
          serializedValue = decodeJsonString(serializedValue);
        } else if (isProxy) {
          serializedValue = { ...serializedValue };
        }

        newProps[key] = serializedValue;
        return newProps;
      }

      // [widgetId] only applies to props on widgets, use method
      // body to distinguish between non-widget callbacks
      const fnKey = [key, widgetId || value.toString().replace(/\\n/g, '')].join('::');
      callbacks[fnKey] = value;

      if (widgetId) {
        if (!newProps.__widgetcallbacks) {
          newProps.__widgetcallbacks = {};
        }

        newProps.__widgetcallbacks[key] = {
          __widgetMethod: fnKey,
          parentId,
        };
      } else {
        if (!newProps.__domcallbacks) {
          newProps.__domcallbacks = {};
        }

        newProps.__domcallbacks[key] = {
          __widgetMethod: fnKey,
        };
      }

      return newProps;
    }, {} as Props);
}

export function serializeArgs({ args, callbacks, widgetId }: SerializeArgsOptions): SerializedArgs {
  return (args || []).map((arg) => {
    if (!arg) {
      return arg;
    }

    if (Array.isArray(arg)) {
      return serializeArgs({ args: arg, callbacks, widgetId });
    }

    if (typeof arg === 'object') {
      const argKeys = Object.keys(arg);
      return Object.fromEntries(
        serializeArgs({
          args: Object.values(arg),
          callbacks,
          widgetId,
        })
          .map((value, i) => [argKeys[i], value])
      );
    }

    if (typeof arg !== 'function') {
      return arg;
    }

    const callbackBody = arg.toString().replace(/\\n/g, '');
    const fnKey = callbackBody + '::' + widgetId;
    callbacks[fnKey] = arg;
    return {
      __widgetMethod: fnKey,
    };
  });
}

export function deserializeProps({
  buildRequest,
  callbacks,
  postCallbackInvocationMessage,
  props,
  requests,
  widgetId,
}: DeserializePropsOptions): object {
  const { __widgetcallbacks } = props;
  const widgetProps = { ...props };
  delete widgetProps.__widgetcallbacks;

  return {
    ...widgetProps,
    ...Object.entries(__widgetcallbacks || {}).reduce((widgetCallbacks, [methodName, { __widgetMethod, parentId }]) => {
      if (props[methodName]) {
        throw new Error(`'duplicate props key ${methodName} on ${widgetId}'`);
      }

      widgetCallbacks[methodName] = (...args: any) => {
        const requestId = window.crypto.randomUUID();
        requests[requestId] = buildRequest();

        // any function arguments are closures in this child widget scope
        // and must be cached in the widget iframe
        postCallbackInvocationMessage({
          args,
          callbacks,
          method: __widgetMethod, // the key on the props object passed to this Widget
          requestId,
          serializeArgs,
          targetId: parentId,
          widgetId,
        });

        return requests[requestId].promise;
      };

      return widgetCallbacks;
    }, {} as { [key: string]: any }),
  };
}

export function serializeNode({ builtinComponents, node, index, childWidgets, callbacks, parentId }: SerializeNodeOptions): SerializedNode {
  function buildWidgetId({ widgetPath, widgetProps, parentWidgetId }: { widgetPath: string, widgetProps: object, parentWidgetId: string }) {
    const serializedProps = JSON.stringify(widgetProps || {}).replace(/[{}\[\]'", ]/g, '');
    const sampleInterval = Math.floor(serializedProps.length / 2048) || 1;
    const sampledProps = serializedProps
      .split('')
      .reduce((sampled, c, i) => i % sampleInterval === 0 ? sampled + c : sampled, '');

    const base64Props = btoa(
      Array.from(
        new TextEncoder().encode(sampledProps),
        (byte) => String.fromCodePoint(byte)
      ).join('')
    );

    return [widgetPath, base64Props, parentWidgetId].join('##');
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  let { type } = node;
  const { children } = node.props;
  let props = { ...node.props };
  delete props.children;

  let unifiedChildren = Array.isArray(children)
    ? children
    : [children];

  unifiedChildren
    .filter((child) => child && typeof child === 'object' && 'childWidgets' in child)
    .forEach((child) => {
      child.childWidgets.forEach((childWidget: any) => childWidgets.push(childWidget));
    });

  if (!type) {
    type = 'div';
  } else if (typeof type === 'function') {
    const { name: component } = type;
    if (component === '_') {
      type = 'div';
      // @ts-expect-error
    } else if (builtinComponents[component]) {
      // @ts-expect-error
      const builtin = builtinComponents[component];
      ({
        props,
        type,
      } = builtin({
        children: unifiedChildren,
        props,
      }));
      unifiedChildren = props.children;
    } else if (component === 'Widget') {
      const { src, props: widgetProps, isTrusted } = props;
      const widgetId = buildWidgetId({ widgetPath: src, widgetProps, parentWidgetId: parentId });
      try {
        childWidgets.push({
          isTrusted: !!isTrusted,
          props: widgetProps ? serializeProps({ props: widgetProps, callbacks, builtinComponents, parentId, widgetId }) : {},
          source: src,
          widgetId,
        });
      } catch (error) {
        console.warn(`failed to dispatch widget load for ${parentId}`, { error, widgetProps });
      }

      return {
        type: 'div',
        props: {
          id: 'dom-' + widgetId,
        },
      };
    } else {
      // `type` is a Preact component function for a child Widget
      // invoke it with the passed props to render the component and serialize its DOM tree
      const node = serializeNode({ builtinComponents, node: type(props), parentId, index, callbacks, childWidgets });
      if (!node || typeof node !== 'object') {
        return node;
      }

      return {
        ...node,
        props: {
          ...node.props,
          id: 'dom-' + buildWidgetId({
            widgetPath: type.name,
            widgetProps: props,
            parentWidgetId: parentId,
          }),
        },
      };
    }
  }

  return {
    type,
    props: {
      ...serializeProps({ props, builtinComponents, callbacks, parentId }),
      children: unifiedChildren
        .flat()
        .map((c, i) => c?.props ? serializeNode({
          node: c,
          builtinComponents,
          index: i,
          childWidgets,
          callbacks,
          parentId,
        }) : c
        ),
    },
    childWidgets,
  };
}
