// https://www.developerway.com/posts/debouncing-in-react

import debounce from 'lodash.debounce';
import { useEffect, useMemo, useRef, useState } from 'react';

export function useDebouncedFunction(
  callback: () => void,
  delay: number
): () => void {
  const ref = useRef<() => void>();

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(() => {
    const func = () => {
      ref.current?.();
    };

    return debounce(func, delay);
  }, [delay]);

  return debouncedCallback;
}

export function useDebouncedValue<T>(value: T, delay: number) {
  const [internalValue, setInternalValue] = useState<T>(value);

  const updateValue = useDebouncedFunction(() => {
    setInternalValue(value);
  }, delay);

  useEffect(() => {
    updateValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return internalValue;
}
