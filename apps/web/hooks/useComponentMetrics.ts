import type {
  ComponentMetrics,
  UpdatedComponent,
} from '@bos-web-engine/application';
import type {
  ComponentCallbackInvocation,
  ComponentCallbackResponse,
  ComponentRender,
} from '@bos-web-engine/container';
import { useCallback, useState } from 'react';

type MetricCollectionItem = ComponentCallbackInvocation | ComponentCallbackResponse | ComponentRender | UpdatedComponent | string;

export function useComponentMetrics() {
  const [metrics, setMetrics] = useState<ComponentMetrics>({
    callbackInvocations: [],
    callbackResponses: [],
    componentRenders: [],
    componentUpdates: [],
    missingComponents: [],
  });

  const buildAppender = useCallback(
    function buildCollectionAppender<T extends MetricCollectionItem>(metricsKey: keyof ComponentMetrics) {
      return (item: T) => setMetrics((currentMetrics) => ({
        ...currentMetrics,
        [metricsKey]: [...currentMetrics[metricsKey], item],
      }));
    },
    []
  );

  return {
    metrics,
    callbackInvoked: buildAppender<ComponentCallbackInvocation>('callbackInvocations'),
    callbackReturned: buildAppender<ComponentCallbackResponse>('callbackResponses'),
    componentMissing: buildAppender<string>('missingComponents'),
    componentRendered: buildAppender<ComponentRender>('componentRenders'),
    componentUpdated: buildAppender<UpdatedComponent>('componentUpdates'),
  };
}
