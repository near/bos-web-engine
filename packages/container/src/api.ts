import type {
  InitNearOptions,
  InitSocialOptions,
  KeyValuePair,
} from './types';

export function initNear({ renderWidget, rpcUrl }: InitNearOptions): any {
  const cache: KeyValuePair = {};
  /* @ts-expect-error */
  const provider = new window.nearApi.providers.JsonRpcProvider(rpcUrl);
  return {
    block(blockHeightOrFinality: string) {
      const cacheKey = JSON.stringify({ blockHeightOrFinality: blockHeightOrFinality.toString(), type: 'block' });
      const block = cache[cacheKey];
      if (block || (cacheKey in cache && block === undefined)) {
        setTimeout(() => delete cache[cacheKey], 5000);
        return block;
      }
      // TODO parameterize correctly
      provider.block({ finality: 'final' })
        .then((block: any) => {
          cache[cacheKey] = block;
          renderWidget();
        })
        .catch(console.error);
    },
    call(contractName: string, methodName: string, args: string, gas: string, deposit: number) {},
    view(contractName: string, methodName: string, args: string, blockId: string | number | object, subscribe: any) {
      const cacheKey = JSON.stringify({ contractName, methodName, args, blockId: 'final', subscribe, type: 'view' });
      if (cache[cacheKey]) {
        return cache[cacheKey];
      }

      this.asyncView(contractName, methodName, args, 'final', subscribe)
        .then((res: any) => {
          cache[cacheKey] = res;
          renderWidget();
        })
        .catch((e: Error) => console.error(e, { contractName, methodName, args, blockId, subscribe }));
    },
    asyncView(contractName: string, methodName: string, args: string, blockId: string | number | object, subscribe: any) {
      const cacheKey = JSON.stringify({ contractName, methodName, args, blockId, subscribe, type: 'view' });
      if (cache[cacheKey]) {
        return cache[cacheKey];
      }
      return provider.query({
        request_type: 'call_function',
        finality: blockId,
        account_id: contractName,
        method_name: methodName,
        args_base64: btoa(Array.from(new TextEncoder().encode(JSON.stringify(args)), (byte) => String.fromCodePoint(byte)).join('')),
      })
        .then(({ result }: { result: Uint8Array }) => {
          const deserialized = JSON.parse(new TextDecoder().decode(Uint8Array.from(result)));
          cache[cacheKey] = deserialized;
          return deserialized;
        });
    },
  };
}

interface SocialQueryKey {
  blockHeight?: number;
  path?: string;
  type?: string;
}

interface SocialQueryOptions {
  action?: string;
  key?: SocialQueryKey | string;
  options?: any;
  keys?: string | string[];
}

export function initSocial({ endpointBaseUrl, renderWidget, widgetId }: InitSocialOptions) {
  const cache: KeyValuePair = {};

  function cachedQuery({ apiEndpoint, body, cacheKey }: { apiEndpoint: string, body: SocialQueryOptions, cacheKey: string }) {
    const cached = cache[cacheKey];
    if (cached || (cacheKey in cache && cached === undefined)) {
      return cached;
    }

    function deepEscape(value: any): any {
      if (typeof value === 'string') {
        return value.replace(/\n/g, '⁣');
      }

      if (Array.isArray(value)) {
        return value.map(deepEscape);
      }

      if (value?.toString() === '[object Object]') {
        return Object.entries(value)
          .reduce((escaped, [k, v]) => {
            escaped[k] = deepEscape(v);
            return escaped;
          }, {} as { [key: string]: any });
      }

      return value;
    }

    cache[cacheKey] = undefined;
    fetch(apiEndpoint, {
      body: JSON.stringify({
        ...body,
        ...(body.keys && { keys: Array.isArray(body.keys) ? body.keys : [body.keys] }),
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
      .then((res) => res.json())
      .then((json) => {
        let escapedJson = deepEscape(json);
        const { keys } = body;
        const unwrap = (result: { [key: string]: any }, path: string): object | string => {
          return path.split('/')
            .filter((p) => p !== '*' && p !== '**')
            .reduce((val, pathComponent) => {
              if (!val) {
                return val;
              }
              return val[pathComponent];
            }, result);
        };

        if (typeof keys === 'string') {
          escapedJson = unwrap(escapedJson, keys);
        }

        cache[cacheKey] = escapedJson;
        renderWidget();
      })
      .catch((e) => console.log({ apiEndpoint, body, error: e, widgetId }));

    return null;
  }

  return {
    get(patterns: string | string[]/*, finality, options*/) {
      return cachedQuery({
        apiEndpoint: `${endpointBaseUrl}/get`,
        body: { keys: patterns },
        cacheKey: JSON.stringify(patterns),
      });
    },
    getr(patterns: string | string[]/*, finality, options*/) {
      if (typeof patterns === 'string') {
        return this.get(`${patterns}/**`);
      }

      return this.get(patterns.map((p) => `${p}/**`));
    },
    index(action: string, key: string | SocialQueryKey, options: object) {
      return cachedQuery({
        apiEndpoint: `${endpointBaseUrl}/index`,
        body: { action, key, options },
        cacheKey: JSON.stringify({ action, key, options }),
      });
    },
    keys(patterns: string[]/*, finality, options*/) {
      return cachedQuery({
        apiEndpoint: `${endpointBaseUrl}/keys`,
        body: { keys: Array.isArray(patterns) ? patterns : [patterns] },
        cacheKey: JSON.stringify(patterns),
      });
    },
  };
}
