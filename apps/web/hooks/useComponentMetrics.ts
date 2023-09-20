import type {
  ComponentMetrics,
  UpdatedComponent,
} from '@bos-web-engine/application';
import type {
  ComponentCallbackInvocation,
  ComponentCallbackResponse,
  ComponentEventData,
  ComponentRender,
} from '@bos-web-engine/container';
import { useCallback, useState } from 'react';

type MetricCollectionItem = ComponentCallbackInvocation | ComponentCallbackResponse | ComponentRender | UpdatedComponent | string;

export function useComponentMetrics() {
  const [metrics, setMetrics] = useState<ComponentMetrics>({
    componentsLoaded: [],
    events: [],
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
    eventReceived: buildAppender<ComponentEventData>('events'),
    componentMissing: buildAppender<string>('missingComponents'),
  };
}
