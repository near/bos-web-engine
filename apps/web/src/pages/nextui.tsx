const PREACT_VERSION = '10.19.3';

const srcDoc = `
<html>
  <body>
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/preact@${PREACT_VERSION}/compat",
          "preact": "https://esm.sh/stable/preact@${PREACT_VERSION}",
          "preact/compat": "https://esm.sh/preact@${PREACT_VERSION}/compat",
          "preact/compat/": "https://esm.sh/preact@${PREACT_VERSION}/compat/",
          "react-dom": "https://esm.sh/preact@${PREACT_VERSION}/compat",
          "@nextui-org/react": "https://esm.sh/@nextui-org/react?alias=react:preact/compat&external=preact",
          "@nextui-org/button": "https://esm.sh/@nextui-org/button?alias=react:preact/compat&external=preact"
        }
      }
    </script>
    <script type="module">
      import { h, render, Fragment } from 'preact';
      
      import { NextUIProvider, Spinner } from '@nextui-org/react';
      import { Button } from '@nextui-org/button';
      
      function App() {
        return h(Fragment, null, h(Button, null, 'lessgo'), h(Spinner, null));
      }

      function Radix() {
        return h(NextUIProvider, null, h(App, null));
      }

      render(h(Radix, null), document.body);
    </script>
  </body>
</html>
`;

export default function X() {
  return (
    <iframe
      id="iframe"
      sandbox="allow-scripts"
      // @ts-expect-error
      csp="default-src 'self';script-src 'unsafe-inline' 'unsafe-eval';script-src-elem https://esm.sh 'unsafe-inline';style-src 'unsafe-inline'"
      srcDoc={srcDoc}
    />
  );
}
