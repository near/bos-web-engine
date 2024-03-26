import { useEffect, useState } from 'react';
import { JSONTree } from 'react-json-tree';

const srcDoc = `
<html>
  <body>
    <script type="importmap">
      {
        "imports": {
          "@chakra-ui/react": "https://esm.sh/@chakra-ui/react@2.8.2?alias=react:preact/compat&deps=preact@10.19.3",
          "@phosphor-icons/react/dist/icons/Plus": "https://esm.sh/@phosphor-icons/react/dist/icons/Plus?alias=react:preact/compat&deps=preact@10.19.3",
          "react": "https://esm.sh/stable/preact@10.19.3/X-YS9yZWFjdDpwcmVhY3QvY29tcGF0/es2022/compat.js",
          "preact": "https://esm.sh/stable/preact@10.19.3",
          "react-dom": "https://esm.sh/stable/preact@10.19.3/X-YS9yZWFjdDpwcmVhY3QvY29tcGF0/es2022/compat.js"
        }
      }        
    </script>
    <script type="module">
      import { ChakraProvider } from '@chakra-ui/react';
      import { Plus } from '@phosphor-icons/react/dist/icons/Plus';
      import { h, render, options, Fragment } from 'preact';
      import { useState } from 'react';

      function extractDom(vnode) {
        if (!vnode || typeof vnode === 'string' || typeof vnode === 'number') {
          return vnode;
        }
      
        if (Array.isArray(vnode)) {
          return vnode.map((v) => extractDom(v));
        }
      
        return Object.fromEntries(
          Object.entries(vnode)
            .filter(([k]) => !['__', '__b', '__c', '__d', '__e', '__n', '__h', '__s', '__P', '__v', 'constructor', 'context', 'children', '_context', 'theme', 'colors', 'Provider', '$$typeof', '_currentValue', '_currentValue2'].includes(k))
            .map(([k, v]) => typeof v === 'function' ? [k, v.name || 'anonymous'] : [k, extractDom(v)])
        );
      }
      
      function Component({ message }) {
        const [value, setValue] = useState(0);
        return h('button', { onClick: () => setValue((v) => v + 1)}, ['increment ' + value, message]);
      }
      
      function Chakra() {
        return h(ChakraProvider, null, h(Component, { message: 'hello~' }));
      }
      
      const oldCommit = options.__c;
      options.__c = (vnode, cq) => {
        oldCommit?.(vnode, cq);
        window.parent.postMessage(extractDom(vnode), '*');
      };

      render(h(Fragment, null, [
        // h(Chakra, null),
        h(Component, { message: 'ª˜ç†˜' }),
        h(Plus, null),
      ]), document.body);
    </script>
  </body>
</html>
`;

export default function Root() {
  const [dom, setDom] = useState(null);
  useEffect(() => {
    function handler(event: any) {
      const { contentWindow } = document.getElementById(
        'iframe'
      ) as HTMLIFrameElement;
      if (event.source !== contentWindow) {
        return;
      }

      setDom(event.data);
    }

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  });

  return (
    <>
      {dom && <JSONTree data={dom} shouldExpandNodeInitially={() => true} />}
      <iframe
        id="iframe"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        csp={[
          "default-src 'self'",
          "script-src 'unsafe-inline' 'unsafe-eval'",
          "script-src-elem https://esm.sh 'unsafe-inline'",
          '',
        ].join('; ')}
      />
    </>
  );
}
