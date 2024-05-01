import { QueryParams } from '@bos-web-engine/common';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useQueryParams() {
  const searchParams = useSearchParams();
  const [queryParams, setQueryParams] = useState<QueryParams>({});

  useEffect(() => {
    /*
      This pattern gives us a more stable reference for queryParams to reduce
      re-renders. We only update our state when searchParams changes.
    */

    const params: QueryParams = {};

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    setQueryParams(params);
  }, [searchParams]);

  return {
    queryParams,
  };
}
