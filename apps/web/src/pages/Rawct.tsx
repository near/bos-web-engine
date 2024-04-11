const PREACT_VERSION = '10.19.3';

const srcDoc = `
<html>
  <body>
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react",
          "react-dom": "https://esm.sh/react-dom",
          "@chakra-ui/react": "https://esm.sh/@chakra-ui/react@2.0.0",
          "@chakra-ui/icons": "https://esm.sh/@chakra-ui/icons"
        }
      }
    </script>
    <script type="module">
      import { extendTheme, ChakraProvider, CircularProgress, Box, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
      import { createElement as h, Fragment, useState } from 'react';
      import { createRoot } from 'react-dom';

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

      createRoot(document.body).render(h(Fragment, null, h(Chakra, null)));
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
      csp="default-src 'self';script-src 'unsafe-inline' 'unsafe-eval';script-src-elem https://esm.sh data: 'unsafe-inline';style-src 'unsafe-inline'"
      srcDoc={srcDoc}
    />
  );
}
