import { useCallback, useState } from 'react';

export function useComponents() {
  const [components, setComponents] = useState<{ [key: string]: any }>({});

  const addComponent = useCallback((componentId: string, component: any) => {
    setComponents((currentComponents) => ({
      ...currentComponents,
      [componentId]: {
        ...currentComponents[componentId],
        ...component,
        renderCount: 1,
      },
    }));
  }, []);

  const getComponentRenderCount = useCallback(
    (componentId: string) => {
      return components?.[componentId]?.renderCount;
    },
    [components]
  );

  const componentRendered = (componentId: string) =>
    setComponents((currentComponents) => ({
      ...currentComponents,
      [componentId]: {
        ...currentComponents[componentId],
        renderCount: currentComponents?.[componentId]?.renderCount + 1 || 0,
      },
    }));

  return {
    addComponent,
    components,
    componentRendered,
    getComponentRenderCount,
    setComponents,
  };
}
