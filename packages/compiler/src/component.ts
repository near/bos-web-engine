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

export function buildComponentFunction({
  componentPath,
  componentSource,
  isRoot,
}: BuildComponentFunctionParams) {
  const functionName = buildComponentFunctionName(isRoot ? '' : componentPath);

  if (isRoot) {
    return `
      function ${functionName}() {
        const { state, State } = (
          ${initializeComponentState.toString()}
        )({
          ComponentState,
          componentInstanceId: props?.__bweMeta?.componentId,
          renderComponent,
        });
        ${componentSource}
      }
    `;
  }

  return `
    /************************* ${componentPath} *************************/
    function ${functionName}(__bweInlineComponentProps) {
      const { __bweMeta, props: __componentProps } = __bweInlineComponentProps;
      const props = Object.assign({ __bweMeta }, __componentProps); 
      const { state, State } = (
        ${initializeComponentState.toString()}
      )({
        ComponentState,
        componentInstanceId: [
          '${componentPath}',
          __bweInlineComponentProps.id,
          __bweMeta?.parentMeta?.componentId,
        ].filter((c) => c !== undefined).join('##'),
      });
      ${componentSource}
    }
  `;
}

interface InitializeComponentStateParams {
  ComponentState: ComponentStateMap;
  componentInstanceId: string;
  renderComponent?: ({ fromState }: { fromState: true }) => void;
}

function initializeComponentState({
  ComponentState,
  componentInstanceId,
  renderComponent,
}: InitializeComponentStateParams) {
  const state = new Proxy(
    {},
    {
      get(_, key) {
        try {
          return ComponentState.get(componentInstanceId)?.[key];
        } catch {
          return undefined;
        }
      },
    }
  );
  const State = {
    init(obj: any) {
      if (!ComponentState.has(componentInstanceId)) {
        ComponentState.set(componentInstanceId, obj);
      }
    },
    update(newState: any, initialState = {}) {
      ComponentState.set(
        componentInstanceId,
        Object.assign(
          initialState,
          ComponentState.get(componentInstanceId),
          newState
        )
      );
      renderComponent?.({ fromState: true });
    },
  };

  return {
    state,
    State,
  };
}
