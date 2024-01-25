import { JsonRpcProvider } from '@near-js/providers';
import type { CodeResult } from '@near-js/types';

import type { SocialComponentsByAuthor } from './types';
import { BOSModuleEntry } from './types';

const encodeComponentKeyArgs = (componentPaths: string[]) => {
  const bytes = new TextEncoder().encode(
    `{"keys":["${componentPaths.join('","')}"]}`
  );
  return btoa(Array.from(bytes, (b) => String.fromCodePoint(b)).join(''));
};

const parseComponentResponse = (bytes: number[]): SocialComponentsByAuthor => {
  const decodedResult = new TextDecoder().decode(Uint8Array.from(bytes));
  return JSON.parse(decodedResult);
};

export function fetchComponentSources(
  rpcUrl: string,
  componentPaths: string[]
) {
  const provider = new JsonRpcProvider({ url: rpcUrl });
  return provider
    .query<CodeResult>({
      account_id: 'social.near',
      args_base64: encodeComponentKeyArgs(
        componentPaths.map((p) => p.split('/').join('/widget/'))
      ),
      finality: 'optimistic',
      method_name: 'get',
      request_type: 'call_function',
    })
    .then(({ result }) => {
      return Object.entries(parseComponentResponse(result)).reduce(
        (sources, [author, { widget: component }]) => {
          Object.entries(component).forEach(
            ([componentKey, componentSource]) => {
              if (typeof componentSource === 'string') {
                const [component, css] = componentSource.split('/*CSS*/');
                sources[`${author}/${componentKey}`] = {
                  component,
                  css,
                };
              } else if (componentSource) {
                const { '': source, css } = componentSource;
                sources[`${author}/${componentKey}`] = {
                  component: source,
                  css,
                };
              } else {
                console.error(`Invalid component source: ${componentSource}`);
              }
            }
          );
          return sources;
        },
        {} as { [key: string]: BOSModuleEntry }
      );
    });
}
