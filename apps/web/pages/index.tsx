import { useRouter } from 'next/router';
import { useState } from 'react';

const DEFAULT_ROOT_COMPONENT = 'andyh.near/widget/LandingPage';

export default function Web() {
  const router = useRouter();
  const [rootComponentPath, setRootComponentPath] = useState('');
  const [rootComponentPathInput, setRootComponentPathInput] = useState(DEFAULT_ROOT_COMPONENT);
  const [showMonitor, setShowMonitor] = useState(true);
  const [showComponentDebug, setShowComponentDebug] = useState(true);

  if (rootComponentPath) {
    router.push(`${rootComponentPath}?isDebug=${showComponentDebug}&showMonitor=${showMonitor}`);
  }

  return (
    <div className='App'>
      {!rootComponentPath && (
        <div id='init-component'>
          <div>
            <input
              type='text'
              value={rootComponentPathInput}
              style={{ width: '400px' }}
              onChange={(e) => setRootComponentPathInput(e.target.value)}
            />
            <button onClick={() => setRootComponentPath(rootComponentPathInput)}>
              Update Root Component
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
              onChange={(e) => setShowComponentDebug(e.target.checked)}
              checked={showComponentDebug}
            />
            <span>Show Component Debug</span>
          </div>
        </div>
      )}
    </div>
  );
}
