/*
  This is a simple re-implementation of: https://github.com/suren-atoyan/monaco-react/blob/master/src/hooks/useMonaco/index.ts
  Due to this open issue: https://github.com/suren-atoyan/monaco-react/issues/440
*/

import { Monaco, loader } from '@monaco-editor/react';
import { useEffect, useState } from 'react';

export function useMonaco(): Monaco | null {
  const [monaco, setMonaco] = useState<Monaco | null>(
    loader.__getMonacoInstance()
  );

  useEffect(() => {
    let cancelable: ReturnType<typeof loader.init>;

    if (!monaco) {
      cancelable = loader.init();

      cancelable
        .then((monaco) => {
          setMonaco(monaco);
        })
        .catch((error) => {
          // Swallow harmless error
          if ((error as any).msg !== 'operation is manually canceled') {
            console.error(error);
          }
        });
    }

    return () => cancelable?.cancel();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return monaco;
}
