import browserslist from 'browserslist';
import initCssWasm, {
  browserslistToTargets,
  Targets,
  transform as transformCss,
  TransformOptions,
  TransformResult,
} from 'lightningcss-wasm';

import type { ParsedCssModule } from './types';

export class CssParser {

  private browserTargets: Targets = browserslistToTargets(browserslist('> 0.5%, last 2 versions, Firefox ESR, not dead'));

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
      targets: this.browserTargets
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
