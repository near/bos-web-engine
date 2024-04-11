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
          "@phosphor-icons/react": "https://esm.sh/@phosphor-icons/react@2.0.15/dist/icons/Horse?alias=react:preact/compat&external=preact",
          "@chakra-ui/react": "https://esm.sh/@chakra-ui/react@2.7.1?alias=react:preact/compat&external=preact",
          "@chakra-ui/icons": "https://esm.sh/@chakra-ui/icons@2.1.1?alias=react:preact/compat&external=preact"
        }
      }
    </script>
    <script type="module">
      import { extendTheme, ChakraProvider, CircularProgress, Box, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
      import { PhoneIcon, AddIcon, WarningIcon } from '@chakra-ui/icons'
      import { Horse } from '@phosphor-icons/react';
      import { h, render, Fragment } from 'preact';
      import { useState } from 'react';

      const colors = {
        brand: {
          900: '#1a365d',
          800: '#153e75',
          700: '#2a69ac',
        },
      };
      
      const theme = extendTheme({ colors });

      function StyledComponent() {
        return h(Fragment, null, [
          h(Box, { m: 122, pb: 4, bgColor: 'brand.700' }, 'hi!'),
          h(PhoneIcon, null),
        ]);
      }
      
      function Tabbs() {
        return h(Tabs, null, [
          h(TabList, null, [
            h(Tab, null, h(PhoneIcon, null)),
            h(Tab, null, h(Horse, null)),
          ]),
          h(TabPanels, null, [
            h(TabPanel, null, h(PhoneIcon, null)),
            h(TabPanel, null, h(PhoneIcon, null)),
          ]),
        ]);
      }

      function Stateful() {
        const [value, setValue] = useState(0);
        return h('button', { onClick: () => { console.log(value);setValue((v) => v + 1);} }, value)
      }

      function Chakra() {
        return h(ChakraProvider, null, h(CircularProgress, { value: 30, size: '120px' }));
      }

      render(h(Fragment, null, h(Chakra, null)), document.body);
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
