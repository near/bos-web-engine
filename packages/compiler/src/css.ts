import initCssWasm, {
  transform as transformCss,
  TransformOptions,
  TransformResult,
} from 'lightningcss-wasm';

import type { ParsedCssModule } from './types';

export class CssParser {
  private lightningCssTransform:
    | ((options: TransformOptions<any>) => TransformResult)
    | undefined;

  async init() {
    if (!this.lightningCssTransform) {
      await initCssWasm();
      this.lightningCssTransform = transformCss;
    }
  }

  parseCssModule(componentPath: string, css: string): ParsedCssModule {
    const { code, exports } = this.lightningCssTransform!({
      code: new TextEncoder().encode(css),
      cssModules: true,
      filename: componentPath,
    });

    return {
      classMap: new Map(
        Object.entries(exports || {}).map(([className, { name }]) => [
          className,
          name,
        ])
      ),
      stylesheet: new TextDecoder().decode(code),
    };
  }
}
