import { JsonRpcProvider } from '@near-js/providers';
import type { CodeResult } from '@near-js/types';

interface SocialComponent {
    widget: { [name: string]: string },
}
type SocialComponentsByAuthor = { [author: string]: SocialComponent };

const encodeComponentKeyArgs = (componentPaths: string[]) => {
  const bytes = new TextEncoder().encode(`{"keys":["${componentPaths.join('","')}"]}`);
  return btoa(Array.from(bytes, (b) => String.fromCodePoint(b)).join(''));
};

const parseComponentResponse = (bytes: number[]): SocialComponentsByAuthor => {
  const decodedResult = new TextDecoder().decode(Uint8Array.from(bytes));
  return JSON.parse(decodedResult);
};

export function fetchComponentSources(rpcUrl: string, componentPaths: string[]) {
  const provider = new JsonRpcProvider({ url: rpcUrl });
  return provider.query<CodeResult>({
    account_id: 'social.near',
    args_base64: encodeComponentKeyArgs(componentPaths),
    finality: 'optimistic',
    method_name: 'get',
    request_type: 'call_function',
  }).then(({ result }) => {
    return Object.entries(parseComponentResponse(result))
      .reduce((sources, [author, { widget: component }]) => {
        Object.entries(component)
          .forEach(([componentKey, componentSource]) => {
            sources[`${author}/widget/${componentKey}`] = componentSource;
          });
        return sources;
      }, {} as { [key: string]: any });
  });
}
