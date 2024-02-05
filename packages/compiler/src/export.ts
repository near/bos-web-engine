/**
 * Supported export syntax:
 *  - export default X;
 *  - export function BWEComponent...
 *  - export const BWEComponent...
 */
const EXPORT_REGEX =
  /^export(?<defaultExport>\s+default)?\s+(const|function)\s+(?<identifier>[\w$_]+)?/gm;

/**
 * Extract the name of the exported reference and strip the export keyword(s) from the source
 * @param source BOS Component source
 */
export const extractExport = (source: string) => {
  return [...source.matchAll(EXPORT_REGEX)].reduce(
    (exported, match) => {
      if (!exported.hasExport) {
        const { defaultExport, identifier } = match.groups as {
          defaultExport: string;
          identifier: string;
        };

        if (defaultExport) {
          if (!identifier) {
            exported.source = exported.source
              .replace(
                /export\s+default\s+function\s*\(/,
                'function BWEComponent('
              )
              .replace(/export\s+default\s+\(/, 'const BWEComponent = (');
          } else {
            exported.exportedReference = identifier;
          }
          exported.hasExport = true;
        } else if (identifier === 'BWEComponent') {
          exported.hasExport = true;
        }
      }

      return {
        ...exported,
        source: exported.source.replace(
          match[0],
          match[0]
            .replace(/export\s+default\s+/, '') // replace "export default"
            .replace(/export\s+(const|function)/, '$1') // remove "export" from export statements
        ),
      };
    },
    {
      exportedReference: '',
      hasExport: false,
      source,
    }
  );
};
