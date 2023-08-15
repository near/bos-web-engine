export default function Transpiler() {
  return (
    <iframe
      id='transpiler'
      // @ts-expect-error: you're wrong about this one, TypeScript
      csp={[
        'default-src \'self\'',
        'connect-src *',
        'img-src * data:',
        'script-src \'unsafe-inline\' \'unsafe-eval\'',
        'script-src-elem https://unpkg.com https://cdn.jsdelivr.net \'unsafe-inline\'',
        '',
      ].join('; ')}
      height={0}
      sandbox='allow-scripts'
      title='transpiler-container'
      width={0}
      style={{ border: 'none' }}
      srcDoc={`
<html>
  <head>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/near-api-js@2.1.3/dist/near-api-js.min.js"></script>
  </head>
  <script type="text/babel" data-presets="react">
    const sourceCache = {};
    const transpiledCache = {};

    function bytesToBase64(bytes) {
      return btoa(Array.from(bytes, (b) => String.fromCodePoint(b)).join(''));
    }

    function buildComponentFunctionName(suffix) {
      let name = 'WidgetComponent';
      if (!suffix) {
        return name;
      }
      
      return name + '_' + suffix.replace(/[.\\/]/g, '');
    }

    function buildComponentFunction({ widgetPath, widgetSource, isRoot }) {
      const componentBody = '\\n\\n/*' + widgetPath + '*/\\n\\n' + widgetSource;
      if (isRoot) {
        return 'function ' + buildComponentFunctionName() + '() {' + componentBody + '}';
      }

      function initState() {
        let _state = {};
        let isStateInitialized = false;

        const state = new Proxy({}, {
          get(_, key) {
            try {
              return _state[key];
            } catch {
              return undefined;
            }
          },
          set() {
            return false;
          },
        });

        const State = {
          init(obj) {
            if (!isStateInitialized) {
              _state = obj;
              isStateInitialized = true;
            }
          },
          update(newState, initialState) {
            // TODO real implementation
            _state = Object.assign({}, state, newState);
          },
        };

        return {
          state,
          State,
        };
      }

      return [
        'function ' + buildComponentFunctionName(widgetPath) + '({ props }) {',
        'const { state, State} = (' + initState.toString() + ')();',
        componentBody,
        '}'
      ].join('\\n\\n');
    }

    function parseChildWidgetPaths(transpiledWidget) {
      const widgetRegex = /h\\(Widget,\\s*\\{(?:[\w\W]*?)(?:\\s*src:\\s+["|'](?<src>[\\w\\d_]+\\.near\\/widget\\/[\\w\\d_.]+))["|']/ig;
      const matches = [...(transpiledWidget.matchAll(widgetRegex))]
        .reduce((widgetInstances, match) => {
          const source = match.groups.src;
          widgetInstances[source] = {
            source,
            transform: (widgetSource, widgetComponentName) => widgetSource.replaceAll(match[0], match[0].replace('Widget', widgetComponentName))
          };

          return widgetInstances;
        }, {});
    
      return Object.values(matches);
    }

    async function parseWidgetTree({ widgetPath, transpiledWidget, mapped }) {
      const childWidgetPaths = parseChildWidgetPaths(transpiledWidget);
      let transformedWidget = transpiledWidget;
      childWidgetPaths.forEach(({ source, transform }) => {
        transformedWidget = transform(transformedWidget, buildComponentFunctionName(source));
      });

      mapped[widgetPath] = {
        transpiled: transformedWidget,
      };

      const childWidgetSources = await fetchWidgetSource(childWidgetPaths.map(({ source }) => source).filter((source) => !(source in mapped)));

      await Promise.all(
        Object.entries(childWidgetSources)
          .map(async ([childPath, widgetSource]) => {
            const transpiledChild = getTranspiledWidgetSource(
              childPath,
              buildComponentFunction({ widgetPath: childPath, widgetSource: await widgetSource, isRoot: false })
            );

            await parseWidgetTree({ widgetPath: childPath, transpiledWidget: transpiledChild, mapped });
          })
      );

      return mapped;
    }

    function transpileSource(source) {
      return Babel.transform(source, {
        plugins: [
          [Babel.availablePlugins['transform-react-jsx'], { pragma: 'h' }],
        ],
      });
    }

    function fetchFromRpc(widgetPaths) {
      const provider = new window.nearApi.providers.JsonRpcProvider('https://rpc.near.org');
      return provider.query({
        account_id: 'social.near',
        args_base64: bytesToBase64(new TextEncoder().encode('{"keys":["' + widgetPaths.join('","') + '"]}')),
        finality: 'optimistic',
        method_name: 'get',
        request_type: 'call_function',
      }).then(({ result }) => {
        const decodedResult = new TextDecoder().decode(Uint8Array.from(result));
        return Object.entries(JSON.parse(decodedResult))
          .reduce((sources, [author, { widget }]) => {
            Object.entries(widget)
              .forEach(([widgetKey, widgetSource]) => {
                sources[author + '/widget/' + widgetKey] = widgetSource;
              });
            return sources;
          }, {});
      });
    }

    function fetchWidgetSource(widgetPaths) {
      const unfetchedPaths = widgetPaths.filter((widgetPath) => !(widgetPath in sourceCache));
      if (unfetchedPaths.length > 0) {
        const pathsFetch = fetchFromRpc(unfetchedPaths);
        unfetchedPaths.forEach((widgetPath) => {
          sourceCache[widgetPath] = pathsFetch.then((paths) => paths[widgetPath])
            .catch((e) => console.error(e, { widgetPath })); 
        });
      }

      return widgetPaths.reduce((widgetSources, widgetPath) => {
        widgetSources[widgetPath] = sourceCache[widgetPath];
        return widgetSources;
      }, {});
    }

    function getTranspiledWidgetSource(widgetPath, widgetSource) {
      if (!transpiledCache[widgetPath]) {
        const { code } = transpileSource(widgetSource);
        transpiledCache[widgetPath] = code;
      }

      return transpiledCache[widgetPath];
    }

    async function getWidgetSource({ widgetId, isTrusted }) {
      const widgetPath = widgetId.split('##')[0];
      const [author, , widget] = widgetPath.split('/');

      try {
        const source = await fetchWidgetSource([widgetPath])[widgetPath];
        const transpiledWidget = getTranspiledWidgetSource(
          widgetPath,
          buildComponentFunction({ widgetPath, widgetSource: source, isRoot: true }),
        );
  
        let widgetComponent = transpiledWidget;
        
        if (isTrusted) {
          // recursively parse the Component tree for child Components
          const transformedWidgets = await parseWidgetTree({ widgetPath, transpiledWidget, mapped: {} });
          const [rootWidget, ...childWidgets] = Object.values(transformedWidgets).map(({ transpiled }) => transpiled);
          const aggregatedSourceLines = rootWidget.split('\\n')
          aggregatedSourceLines.splice(1, 0, childWidgets.join('\\n\\n'));
          widgetComponent = aggregatedSourceLines.join('\\n');
        }
        
        window.parent.postMessage({
          type: 'transpiler.sourceTranspiled',
          source: widgetId,
          widgetComponent,
        }, '*');
      } catch (e) {
        console.error(e);
      };
    }

    window.addEventListener('message', (event) => {
      const { data } = event;
      if (data?.type === 'transpiler.widgetFetch') {
        getWidgetSource({ widgetId: data.source, isTrusted: data.isTrusted });
      }
    });
  </script>
</html>
          `}
    />
  );
}
