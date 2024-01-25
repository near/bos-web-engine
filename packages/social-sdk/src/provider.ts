import { JsonRpcProvider } from '@near-js/providers';
import type { CodeResult } from '@near-js/types';

const encodeArgs = (args: Record<any, any>) => {
  const bytes = new TextEncoder().encode(JSON.stringify(args));
  return window.btoa(
    Array.from(bytes, (b) => String.fromCodePoint(b)).join('')
  );
};

const parseComponentResponse = (bytes: number[]): Record<any, any> => {
  const decodedResult = new TextDecoder().decode(Uint8Array.from(bytes));
  return JSON.parse(decodedResult);
};

type ProviderFetchOptions = {
  accountId: string;
  args: Record<any, any>;
  methodName: string;
};

export async function fetchWithProvider<T = Record<any, any>>(
  provider: JsonRpcProvider,
  { accountId, args, methodName }: ProviderFetchOptions
) {
  const response = await provider.query<CodeResult>({
    account_id: accountId,
    args_base64: encodeArgs(args),
    finality: 'optimistic',
    method_name: methodName,
    request_type: 'call_function',
  });

  return parseComponentResponse(response.result) as T;
}
