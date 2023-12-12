import type { WebEngineFlags } from '@bos-web-engine/application';
import { useCallback, useEffect, useState } from 'react';

/**
 * Use Application flags
 *
 * `const [flags, setFlags] = useFlags();`
 *
 * Warning: setFlags causes page reload
 */

export function useFlags() {
  const [rawFlags, setRawFlags] = useState<WebEngineFlags>();

  useEffect(() => {
    const flags = localStorage.getItem('flags')
      ? JSON.parse(localStorage.getItem('flags') || '')
      : {};
    setRawFlags(flags);
  }, []);

  const setFlags = useCallback((newFlags: WebEngineFlags) => {
    setRawFlags((f) => {
      const updated = { ...f, ...newFlags };
      localStorage.setItem('flags', JSON.stringify(updated));

      alert('Flags have been saved.');

      // reload for changes to take effect
      location.reload();

      // may not be reachable
      return updated;
    });
  }, []);

  return [rawFlags, setFlags] as const;
}
