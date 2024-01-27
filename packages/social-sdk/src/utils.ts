import { Big } from 'big.js';

import { ESTIMATED_KEY_VALUE_SIZE, ESTIMATED_NODE_SIZE } from './constants';

/*
  TODO: Most of these utils have been copied over from NearSocial/VM and could 
  probably be refactored as we have time.
*/

export const encodeJsonRpcArgs = (args: Record<any, any>) => {
  const bytes = new TextEncoder().encode(JSON.stringify(args));
  return btoa(Array.from(bytes, (b) => String.fromCodePoint(b)).join(''));
};

export const parseJsonRpcResponse = (bytes: number[]): Record<any, any> => {
  const decodedResult = new TextDecoder().decode(Uint8Array.from(bytes));
  return JSON.parse(decodedResult);
};

export function bigMax(a: Big, b: Big) {
  return a.gt(b) ? a : b;
}

export function convertToStringLeaves(data: any) {
  return isObject(data)
    ? Object.entries(data).reduce(
        (obj, [key, value]) => {
          obj[key] = convertToStringLeaves(value);
          return obj;
        },
        {} as Record<string, any>
      )
    : stringify(data);
}

export function estimateRequiredBytesForStorage(
  newData: Record<string, any>,
  currentData: any
): number {
  return isObject(newData)
    ? Object.entries(newData).reduce(
        (s, [key, value]) => {
          const prevValue = isObject(currentData)
            ? currentData[key]
            : undefined;
          return (
            s +
            (prevValue !== undefined
              ? estimateRequiredBytesForStorage(value, prevValue)
              : key.length * 2 +
                estimateRequiredBytesForStorage(value, undefined) +
                ESTIMATED_KEY_VALUE_SIZE)
          );
        },
        isObject(currentData) ? 0 : ESTIMATED_NODE_SIZE
      )
    : (newData?.length || 8) -
        (typeof currentData === 'string' ? currentData.length : 0);
}

export function extractKeys(data: Record<string, any>, prefix = ''): string[] {
  return Object.entries(data)
    .map(([key, value]) =>
      isObject(value)
        ? extractKeys(value, `${prefix}${key}/`)
        : `${prefix}${key}`
    )
    .flat();
}

function isObject(value: any) {
  return (
    value === Object(value) &&
    !Array.isArray(value) &&
    typeof value !== 'function'
  );
}

/**
 * Returns an empty object if both objects are perfect matches. Otherwise,
 * an object is returned containing only the keys and values from `data`
 * that differ from `prevData`.
 */
export function removeDuplicateData(
  newData: Record<string, any>,
  currentData: Record<string, any>
): Record<string, any> {
  const obj = Object.entries(newData).reduce(
    (obj, [key, value]) => {
      const prevValue = isObject(currentData) ? currentData[key] : undefined;

      if (isObject(value)) {
        const newValue = isObject(prevValue)
          ? removeDuplicateData(value, prevValue)
          : value;

        if (newValue !== undefined) {
          obj[key] = newValue;
        }
      } else if (value !== prevValue) {
        obj[key] = value;
      }

      return obj;
    },
    {} as Record<string, any>
  );

  return obj;
}

function stringify(value: any) {
  if (value === null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}
