interface GetClosingIndexParams {
  source: string;
  openChar: string;
  closeChar: string;
  startIndex: number;
}

/**
 * Find the index of the closing character
 * @param source target string to parse
 * @param openChar opening character (e.g. `{`)
 * @param closeChar closing character (e.g. `}`)
 * @param startIndex index of the first opening character within source
 */
export function getClosingCharIndex({
  source,
  openChar,
  closeChar,
  startIndex = 0,
}: GetClosingIndexParams) {
  let openCount = 0;
  let i = startIndex;
  if (source[i] !== openChar) {
    throw new Error(
      `Source must begin with "${openChar}": "${
        source.length > 16 ? `${source.slice(0, 16)}...` : source
      }"`
    );
  }

  do {
    const char = source[i++];
    if (char === openChar) {
      openCount++;
    } else if (char === closeChar) {
      openCount--;
    } else if (char === undefined) {
      // no closing character in source
      return null;
    }
  } while (openCount > 0);

  return i;
}
