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

  const stateInitialization = 'const { state, State} = (' + initializeComponentState.toString() + ')(ComponentState, "' + componentPath + '", renderWidget);';
  if (isRoot) {
    return `
      function ${buildComponentFunctionName()}() {
        ${stateInitialization}
        ${componentBody}
      }
    `;
  }

  return `
    function ${buildComponentFunctionName(componentPath)}({ props }) {
      ${stateInitialization}
      ${componentBody}
    }
  `;
}

function initializeComponentState(ComponentState: ComponentStateMap, componentInstanceId: string, renderWidget: () => void) {
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
      renderWidget();
    },
  };

  return {
    state,
    State,
  };
}
