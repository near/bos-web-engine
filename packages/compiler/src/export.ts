/**
 * Supported export syntax:
 *  - export default X;
 *  - export function X...
 *  - export const X...
 */
const EXPORT_REGEX =
  /^export\s+(const|default|function)\s+(?<identifier>[\w$_]+)/g;

/**
 * Extract the name of the exported reference and strip the export keyword(s) from the source
 * @param source BOS Component source
 */
export const extractExport = (source: string) => {
  const [match, ...matches] = [...source.matchAll(EXPORT_REGEX)];
  if (matches.length) {
    throw new Error(`Multiple exports not permitted: ${matches.join(', ')}`);
  }

  if (!match?.groups?.identifier) {
    return { exported: null, source };
  }

  return {
    exported: match.groups.identifier,
    source: source.replace(
      match[0],
      match[0].replace(/export(\s+default)?\s+/, '')
    ),
  };
};
