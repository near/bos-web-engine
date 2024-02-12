import { getClosingCharIndex } from './text';
import type { ParsedCssModule } from './types';

const CLASS_SELECTOR_REGEX = /^(\.-?[_a-zA-Z]+[_a-zA-Z0-9:, -]*)+/gim;

export function parseCssModule(css: string): ParsedCssModule {
  const pseudoClasses = new Map<string, string>();
  const classSelectors = new Map<string, string>();

  for (let classSelectorMatch of css.matchAll(CLASS_SELECTOR_REGEX)) {
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

    const cssBody = css.slice(index, cssBodyClosingIndex);

    css
      .slice(index, bodyOpenIndex)
      .split(',')
      .map((c) => c.trim().substring(1))
      .filter((c) => !!c)
      .forEach((classSelector) => {
        const [className, pseudoClass] = classSelector.split(':');
        if (pseudoClass) {
          pseudoClasses.set(className, cssBody);
        } else {
          classSelectors.set(className, cssBody);
        }
      });
  }

  for (let [className, css] of pseudoClasses.entries()) {
    const selectorBlock = classSelectors.get(className);
    if (selectorBlock) {
      const pseudoClassBody = css.replace(`.${className}`, '&');
      classSelectors.set(
        className,
        selectorBlock.replace('{', `{\n\n${pseudoClassBody}\n\n`)
      );
    } else {
      classSelectors.set(className, css.replace(`.${className}`, ''));
    }
  }

  const classMap = new Map<string, string>();
  const stylesheet = [...classSelectors.entries()].reduce(
    (stylesheet, [className, css]) => {
      const modifiedClassName = `${className}_${crypto
        .randomUUID()
        .split('-')
        .slice(0, 2)
        .join('')}`;

      classMap.set(className, modifiedClassName);

      return `
        ${stylesheet}
        ${css.replace(className, modifiedClassName)}
      `;
    },
    ''
  );

  return { classMap, stylesheet };
}
