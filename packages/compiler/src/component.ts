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
    const { state, State } = (
      ${initializeComponentState.toString()}
    )({
      ComponentState,
      componentInstanceId,
    });
  `;

  if (isRoot) {
    return `
      function ${functionName}() {
        const componentInstanceId = props?.__bweMeta?.componentId;
        ${stateInitialization}
        ${componentBody}
      }
    `;
  }

  return `
    function ${functionName}(__bweInlineComponentProps) {
      const { props } = __bweInlineComponentProps;
      const componentInstanceId = [
        '${componentPath}',
        __bweInlineComponentProps.id,
        __bweInlineComponentProps.__bweMeta?.parentMeta?.componentId,
      ].filter((c) => c !== undefined).join('##');
      ${stateInitialization}
      ${componentBody}
    }
  `;
}

interface InitializeComponentStateParams {
  ComponentState: ComponentStateMap;
  componentInstanceId: string;
}

function initializeComponentState({
  ComponentState,
  componentInstanceId,
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
