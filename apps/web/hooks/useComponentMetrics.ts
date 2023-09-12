import type {
  WidgetUpdate,
} from '@bos-web-engine/application';
import type {
  PostMessageWidgetCallbackInvocation,
  PostMessageWidgetCallbackResponse,
  PostMessageWidgetRender,
} from '@bos-web-engine/container';
import { useState } from 'react';

export function useComponentMetrics() {
  const [callbackInvocations, setCallbackInvocations] = useState<PostMessageWidgetCallbackInvocation[]>([]);
  const [callbackResponses, setCallbackResponses] = useState<PostMessageWidgetCallbackResponse[]>([]);
  const [componentRenders, setComponentRenders] = useState<PostMessageWidgetRender[]>([]);
  const [componentUpdates, setComponentUpdates] = useState<WidgetUpdate[]>([]);
  const [missingComponents, setMissingComponents] = useState<string[]>([]);

  return {
    metrics: {
      callbackInvocations,
      callbackResponses,
      componentRenders,
      componentUpdates,
      missingComponents,
    },
    callbackInvoked: (callback: PostMessageWidgetCallbackInvocation) => setCallbackInvocations((current) => [...current, callback]),
    callbackReturned: (response: PostMessageWidgetCallbackResponse) => setCallbackResponses((current) => [...current, response]),
    componentMissing: (componentId: string) => setMissingComponents((current) => [...current, componentId]),
    componentRendered: (component: PostMessageWidgetRender) => setComponentRenders((current) => [...current, component]),
    componentUpdated: (component: WidgetUpdate) => setComponentUpdates((current) => [...current, component]),
  };
}
