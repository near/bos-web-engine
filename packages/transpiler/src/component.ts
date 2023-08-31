type ComponentStateMap = Map<string, { [key: string | symbol]: any }>;

/**
 * Returns the name to be used for the Component
 * @param componentInstanceId unique identifier for the Component instance
 */
export function buildComponentFunctionName(componentInstanceId?: string) {
    const name = 'BWEComponent';
    if (!componentInstanceId) {
        return name;
    }

    return name + '_' + componentInstanceId.replace(/[.\/]/g, '');
}

/**
 * Returns the name to be used for the Component
 * @param componentInstanceId unique identifier for the Component instance
 */
export function buildComponentFunction({ widgetPath, widgetSource, isRoot }: { widgetPath: string, widgetSource: string, isRoot: boolean }) {
  const componentBody = '\n\n/*' + widgetPath + '*/\n\n' + widgetSource;

  const stateInitialization = 'const { state, State} = (' + initializeComponentState.toString() + ')(ComponentState, "' + widgetPath + '");';
  if (isRoot) {
    return `
      function ${buildComponentFunctionName()}() {
        const ComponentState = new Map();
        ${stateInitialization}
        ${componentBody}
      }
    `;
  }

  return `
    function ${buildComponentFunctionName(widgetPath)}({ props }) {
      ${stateInitialization}
      ${componentBody}
    }
  `;
}

/**
 * Returns the name to be used for the Component
 * @param componentInstanceId unique identifier for the Component instance
 */
function initializeComponentState(ComponentState: ComponentStateMap, componentInstanceId: string) {
    const buildSafeProxyFromMap = (map: ComponentStateMap, widgetId: string) => new Proxy({}, {
        get(_, key) {
            try {
                return map.get(widgetId)?.[key];
            } catch {
                return undefined;
            }
        }
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
        state: buildSafeProxyFromMap(ComponentState, componentInstanceId),
        State,
    };
}