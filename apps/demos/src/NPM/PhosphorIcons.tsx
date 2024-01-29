// Do not use `import { Horse } from '@phosphor-icons/react';`
// this triggers network requests for *every* icon simultaneously
import { Horse } from '@phosphor-icons/react/dist/icons/Horse';

export default function () {
  return <Horse />;
}
