import type { WebEngineMeta } from '@bos-web-engine/container';

type ComponentStateMap = Map<string, { [key: string | symbol]: any }>;

/**
 * Returns the name to be used for the Component function
 * @param componentPath
 */
export function buildComponentFunctionName(componentPath?: string) {
  const name = 'BWEComponent';
  if (!componentPath) {
    return name;
  }

  return name + '_' + componentPath.replace(/[.\/]/g, '');
}

interface BuildComponentFunctionParams {
  componentPath: string;
  componentSource: string;
  isRoot: boolean;
}

export function buildComponentFunction({ componentPath, componentSource, isRoot }: BuildComponentFunctionParams) {
  const functionName = buildComponentFunctionName(isRoot ? '' : componentPath);
  const componentBody = `
/************************* ${componentPath} *************************/
${componentSource}
`;

  const stateInitialization =  `
    const componentInstanceId = props?.__bweMeta?.componentId || [
      '${componentPath}',
      typeof id !== 'undefined' ? id : undefined,
      __bweMeta?.parentMeta?.componentId,
    ].filter((c) => c !== undefined).join('##');

    const { state, State } = (
      ${initializeComponentState.toString()}
    )({
      ComponentState,
      componentInstanceId,
      componentFunction: ${functionName},
      componentProps: props,
      dispatchRenderEvent,
      __bweMeta: typeof __bweMeta === 'undefined' ? props.__bweMeta : __bweMeta,
    });
  `;

  if (isRoot) {
    return `
      function ${functionName}() {
        ${stateInitialization}
        ${componentBody}
      }
    `;
  }

  return `
    function ${functionName}({ id, props, __bweMeta }) {
      ${stateInitialization}
      ${componentBody}
    }
  `;
}

interface ComponentFunctionProps {
  props: object;
  __bweMeta: WebEngineMeta;
}

interface InitializeComponentStateParams {
  __bweMeta: WebEngineMeta;
  ComponentState: ComponentStateMap;
  componentInstanceId: string;
  componentFunction: (props: ComponentFunctionProps) => Node;
  componentProps: any;
  dispatchRenderEvent: (node: Node, componentId: string) => void;
}

function initializeComponentState({
  __bweMeta,
  ComponentState,
  componentInstanceId,
  componentFunction,
  componentProps,
  dispatchRenderEvent,
}: InitializeComponentStateParams) {
  const state = new Proxy({}, {
    get(_, key) {
      try {
        return ComponentState.get(componentInstanceId)?.[key];
      } catch {
        return undefined;
      }
    },
  });
  const State = {
    init(obj: any) {
      if (!ComponentState.has(componentInstanceId)) {
        ComponentState.set(componentInstanceId, obj);
      }
    },
    update(newState: any, initialState = {}) {
      ComponentState.set(componentInstanceId, Object.assign(initialState, ComponentState.get(componentInstanceId), newState));
    },
  };

  return {
    state,
    State,
  };
}
