import { useCallback, useEffect, useRef } from 'react';

/**
 * Manage CSS across stylesheets in the Component tree
 */
export function useCss() {
  const containerStylesheet = useRef<CSSStyleSheet | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = `bwe-styles-${Date.now()}`;
    style.appendChild(document.createTextNode(''));
    document.head.appendChild(style);

    // @ts-expect-error StyleSheetList can be inlined despite TS complaints about [Symbol.iterator]()
    containerStylesheet.current = [...document.styleSheets].find(
      ({ ownerNode }) => ownerNode === style
    );
  }, []);

  const appendStylesheet = useCallback((containerStyles: string) => {
    const css = new CSSStyleSheet();
    css.replaceSync(containerStyles);

    // @ts-expect-error StyleSheetList can be inlined despite TS complaints about [Symbol.iterator]()
    for (let { cssText } of css.cssRules) {
      containerStylesheet.current!.insertRule(cssText);
    }
  }, []);

  const resetContainerStylesheet = useCallback(() => {
    const rulesCount = containerStylesheet.current!.cssRules.length;
    for (let i = rulesCount - 1; i >= 0; i--) {
      containerStylesheet.current!.deleteRule(i);
    }
  }, [containerStylesheet]);

  return {
    appendStylesheet,
    resetContainerStylesheet,
  };
}
