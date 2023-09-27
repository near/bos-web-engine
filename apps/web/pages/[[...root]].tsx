import { useRouter } from "next/router";

import { ComponentTree } from "../components";
import { useWebEngine } from "../hooks";
import { useEffect } from "react";

const DEFAULT_COMPONENT = process.env.NEXT_PUBLIC_DEFAULT_ROOT_COMPONENT;

export default function Root() {
  const router = useRouter();
  const { query } = router;

  const isDebug = query.isDebug === "true";
  const showMonitor = query.showMonitor === "true";
  const rootComponentPath = Array.isArray(query.root)
    ? query.root.join("/")
    : null;

  useEffect(() => {
    if (router.isReady && !query.root && DEFAULT_COMPONENT) {
      // change URL in place to accurately reflect default param values
      router.push(`/${DEFAULT_COMPONENT}`, undefined, { shallow: true });
    }
  }, [router.isReady, query.root]);

  return (
    <div className="App">
      {rootComponentPath && (
        <WebEngineRoot
          rootComponentPath={rootComponentPath}
          isDebug={isDebug}
          showMonitor={showMonitor}
        />
      )}
    </div>
  );
}

// conditionally rendered when rootComponentPath is defined so that
// we do not have to account for invocations of hook before router
// params are ready for consumption
function WebEngineRoot({
  rootComponentPath,
  isDebug,
  showMonitor,
}: {
  rootComponentPath: string;
  isDebug: boolean;
  showMonitor: boolean;
}) {
  const { components, error, metrics } = useWebEngine({
    rootComponentPath,
    debugConfig: {
      isDebug,
      showMonitor,
    },
  });

  return (
    <>
      {error ? (
        <div className="error">{error}</div>
      ) : (
        <ComponentTree
          components={components}
          isDebug={isDebug}
          metrics={metrics}
          rootComponentPath={rootComponentPath}
          showMonitor={showMonitor}
        />
      )}
    </>
  );
}
