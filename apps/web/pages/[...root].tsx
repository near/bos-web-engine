import {
  ComponentMonitor,
} from '@bos-web-engine/application';
import { getAppDomId, getIframeId, SandboxedIframe } from '@bos-web-engine/iframe';
import { useRouter } from 'next/router';

import { useWebEngine } from '../hooks';

export default function Web() {
  const router = useRouter();
  const { query } = router;

  const isDebug = query.isDebug === 'true';
  const showMonitor = query.showMonitor === 'true';
  const rootComponentPath = ((query.root || []) as string[]).join('/');

  const { components, error, metrics } = useWebEngine({
    showComponentDebug: isDebug,
    rootComponentPath,
  });

  return (
    <div className='App'>
      {error && (
        <div className='error'>
          {error}
        </div>
      )}
      {!error && rootComponentPath && (
        <>
          {showMonitor && <ComponentMonitor metrics={metrics} components={Object.values(components)} />}
          <div id={getAppDomId(rootComponentPath)} className='iframe'>
            root component goes here
          </div>
          <div className="iframes">
            {isDebug && (<h5>[hidden iframes]</h5>)}
            {
              Object.entries(components)
                .filter(([, component]) => !!component?.componentSource)
                .map(([componentId, { isTrusted, props, componentSource }]) => (
                  <div key={componentId} component-id={componentId}>
                    <SandboxedIframe
                      id={getIframeId(componentId)}
                      isTrusted={isTrusted}
                      scriptSrc={componentSource}
                      componentProps={props}
                    />
                  </div>
                ))
            }
          </div>
        </>
      )}
    </div>
  );
}
