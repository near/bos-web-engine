import type { ComponentMetrics, BWEMessage } from '@bos-web-engine/application';
import { useCallback, useState } from 'react';

type MetricCollectionItem = BWEMessage | string;

export function useComponentMetrics() {
  const [metrics, setMetrics] = useState<ComponentMetrics>({
    componentsLoaded: [],
    messages: [],
  });

  const buildAppender = useCallback(function buildCollectionAppender<
    T extends MetricCollectionItem,
  >(metricsKey: keyof ComponentMetrics) {
    return (item: T) =>
      setMetrics((currentMetrics) => ({
        ...currentMetrics,
        [metricsKey]: [...currentMetrics[metricsKey], item],
      }));
  }, []);

  return {
    metrics,
    recordMessage: buildAppender<BWEMessage>('messages'),
  };
}
