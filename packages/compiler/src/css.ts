import { getClosingCharIndex } from './text';
import type { ParsedCssModule } from './types';

export function parseCssModule(css: string): ParsedCssModule {
  return [...css.matchAll(/^(\.-?[_a-zA-Z]+[_a-zA-Z0-9-, ]*)+/gim)].reduce(
    ({ classMap, stylesheet }, classSelectorMatch) => {
      const { index } = classSelectorMatch;
      const bodyOpenIndex = css.indexOf('{', index);

      const cssBodyClosingIndex = getClosingCharIndex({
        source: css,
        openChar: '{',
        closeChar: '}',
        startIndex: bodyOpenIndex,
      });

      if (cssBodyClosingIndex === null) {
        throw new Error('Invalid source CSS');
      }

      const classes = css
        .slice(index, bodyOpenIndex)
        .split(',')
        .map((c) => c.trim().substring(1))
        .filter((c) => !!c);

      let cssBody = css.slice(index, cssBodyClosingIndex);
      classes.forEach((className) => {
        const modifiedClassName = `${className}_${crypto
          .randomUUID()
          .split('-')
          .slice(0, 2)
          .join('')}`;

        classMap.set(className, modifiedClassName);
        cssBody = cssBody.replace(className, modifiedClassName);
      });

      return {
        classMap,
        stylesheet: `
          ${stylesheet}
          ${cssBody}
        `,
      };
    },
    { classMap: new Map<string, string>(), stylesheet: '' }
  );
}
