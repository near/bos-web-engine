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
  const componentBody = '\n\n/*' + componentPath + '*/\n\n' + componentSource;
  const functionName = buildComponentFunctionName(isRoot ? '' : componentPath);

  const stateInitialization = `
    const { state, State } = (
      ${initializeComponentState.toString()}
    )({
      ComponentState,
      componentInstanceId: props?.__bweMeta?.componentId,
      componentFunction: ${functionName},
      componentProps: props,
      dispatchRenderEvent,
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
    function ${functionName}({ props }) {
      ${stateInitialization}
      ${componentBody}
    }
  `;
}

interface InitializeComponentStateParams {
  ComponentState: ComponentStateMap;
  componentInstanceId: string;
  componentFunction: (props: any) => any;
  componentProps: any;
  dispatchRenderEvent: (node: Node, componentId: string) => void;
}

function initializeComponentState({
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
      // FIXME need to debug empty renders
      // dispatchRenderEvent(componentFunction({ props: componentProps }), componentInstanceId);
    },
  };

  return {
    state,
    State,
  };
}
