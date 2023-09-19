import type {
  UpdatedComponent,
} from '@bos-web-engine/application';
import type {
  ComponentCallbackInvocation,
  ComponentCallbackResponse,
  ComponentRender,
} from '@bos-web-engine/container';
import { useState } from 'react';

export function useComponentMetrics() {
  const [callbackInvocations, setCallbackInvocations] = useState<ComponentCallbackInvocation[]>([]);
  const [callbackResponses, setCallbackResponses] = useState<ComponentCallbackResponse[]>([]);
  const [componentRenders, setComponentRenders] = useState<ComponentRender[]>([]);
  const [componentUpdates, setComponentUpdates] = useState<UpdatedComponent[]>([]);
  const [missingComponents, setMissingComponents] = useState<string[]>([]);

  return {
    metrics: {
      callbackInvocations,
      callbackResponses,
      componentRenders,
      componentUpdates,
      missingComponents,
    },
    callbackInvoked: (callback: ComponentCallbackInvocation) => setCallbackInvocations((current) => [...current, callback]),
    callbackReturned: (response: ComponentCallbackResponse) => setCallbackResponses((current) => [...current, response]),
    componentMissing: (componentId: string) => setMissingComponents((current) => [...current, componentId]),
    componentRendered: (component: ComponentRender) => setComponentRenders((current) => [...current, component]),
    componentUpdated: (component: UpdatedComponent) => setComponentUpdates((current) => [...current, component]),
  };
}
