import { useRouter } from 'next/router';
import { useEffect } from 'react';

const DEFAULT_ROOT_COMPONENT = 'andyh.near/widget/LandingPage';

export default function Web() {
  const router = useRouter();

  useEffect(() => {
    router.push(`${DEFAULT_ROOT_COMPONENT}?isDebug=true&showMonitor=true`)
      .catch(console.error);
  }, [router]);

  return (
    <div className='App' />
  );
}
