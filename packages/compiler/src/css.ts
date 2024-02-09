import { getClosingCharIndex } from './text';
import type { ParsedCssModule } from './types';

export function parseCssModule(css: string): ParsedCssModule {
  return [...css.matchAll(/^\.(\w\S+)\s*{\s*$/gim)].reduce(
    ({ classMap, stylesheet }, classSelectorMatch) => {
      const [classSelector, className] = classSelectorMatch;
      const { index } = classSelectorMatch;

      const cssBodyClosingIndex = getClosingCharIndex({
        source: css,
        openChar: '{',
        closeChar: '}',
        startIndex: index! + classSelector.length - 1,
      });

      if (cssBodyClosingIndex === null) {
        throw new Error('Invalid source CSS');
      }

      const modifiedClassName = `${className}_${crypto
        .randomUUID()
        .split('-')
        .slice(0, 2)
        .join('')}`;
      classMap.set(className, modifiedClassName);

      const cssBody = css.slice(index, cssBodyClosingIndex);
      return {
        classMap,
        stylesheet: `
          ${stylesheet}
          ${cssBody.replace(className, modifiedClassName)}
        `,
      };
    },
    { classMap: new Map<string, string>(), stylesheet: '' }
  );
}
