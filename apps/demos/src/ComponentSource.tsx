import { useState, useEffect } from 'react';
import s from './styles.module.css';
import { socialDb } from '@bos-web-engine/social-db-plugin';

import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter?exports=PrismLight';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';

type Props = {};

function MyComponent({ }: Props) {
  const [source, setSource] = useState<{ name: string, src: string, css?: string }>();
  const [path, setPath] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    SyntaxHighlighter.registerLanguage('tsx', tsx);
    SyntaxHighlighter.registerLanguage('css', css);
  }, []);

  const fetchSource = async () => {
    const [author, component] = path.trim().split('/');
    if (!author || !component) {
      setError('Please enter a valid component in the form of author/component');
      return;
    }
    const result = await socialDb.get({
      key: `${author}/component_alpha/${component}/**`
    });

    const src = result[author]?.component_alpha?.[component]?.[''];
    const css = result[author]?.component_alpha?.[component]?.css;

    if (!src) {
      setError('No component code found');
      return;
    }

      setSource({ name: component, src, css });
  };

  return (
    <div className={s.wrapper}>
      <h1>BWE Component Source Inspector</h1>
      <div className={s.entry}>
        <input type='text' placeholder='<author>/<component>' value={path} onChange={(e) => {
          setError('');
          setPath(e.target.value);
        }} />
        <button onClick={fetchSource}>View</button>
      </div>
      <p>e.g. <code>webengine.near/SocialFeedPage</code></p>
      {error && <span>{error}</span>}
      <div className={s.codeContainer}>
        {source?.src &&
          <>
            <h2>{source.name}.tsx</h2>
            <SyntaxHighlighter language="tsx" showLineNumbers style={oneDark}>
              {source.src}
            </SyntaxHighlighter>
            <hr />
          </>
        }
        {source?.css &&
          <>
            <h2>{source.name}.module.css</h2>
            <SyntaxHighlighter language="css" showLineNumbers style={oneDark}>
              {source.css}
            </SyntaxHighlighter>
          </>
        }
      </div>
    </div>
  );
}

export default MyComponent as BWEComponent<Props>;
