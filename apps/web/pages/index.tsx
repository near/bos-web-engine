import { useRouter } from 'next/router';
import { useState } from 'react';

const DEFAULT_ROOT_WIDGET = 'andyh.near/widget/ComponentIdTestRoot';

export default function Web() {
  const router = useRouter();
  const [rootComponentPath, setRootComponentPath] = useState('');
  const [rootComponentPathInput, setRootComponentPathInput] = useState(DEFAULT_ROOT_WIDGET);
  const [showMonitor, setShowMonitor] = useState(true);
  const [showWidgetDebug, setShowWidgetDebug] = useState(true);

  if (rootComponentPath) {
    router.push(`components/${rootComponentPath}?isDebug=${showWidgetDebug}`);
  }

  return (
    <div className='App'>
      {!rootComponentPath && (
        <div id='init-widget'>
          <div>
            <input
              type='text'
              value={rootComponentPathInput}
              style={{ width: '400px' }}
              onChange={(e) => setRootComponentPathInput(e.target.value)}
            />
            <button onClick={() => setRootComponentPath(rootComponentPathInput)}>
              Update Root Widget
            </button>
          </div>
          <div className='debug-option'>
            <input
              type="checkbox"
              onChange={(e) => setShowMonitor(e.target.checked)}
              checked={showMonitor}
            />
            <span>Show Monitor</span>
          </div>
          <div className='debug-option'>
            <input
              type="checkbox"
              onChange={(e) => setShowWidgetDebug(e.target.checked)}
              checked={showWidgetDebug}
            />
            <span>Show Widget Debug</span>
          </div>
        </div>
      )}
    </div>
  );
}
