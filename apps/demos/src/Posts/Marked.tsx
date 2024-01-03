export function BWEComponent() {
  const [Markdown, setMarkdown] = useState(null);
  const importMarkdown = async () => {
    try {
      const markdownDyn = await import(
        'https://esm.sh/marked-react@2.0.0?alias=react:preact/compat'
      );
      console.log('markdown imported');
      setMarkdown(markdownDyn);
    } catch (err) {
      console.log('markdown import error', err);
    }
  };

  useEffect(() => {
    importMarkdown();
  }, []);

  return Markdown ? <Markdown>{'# hello world'}</Markdown> : <div>Loading</div>;
}
