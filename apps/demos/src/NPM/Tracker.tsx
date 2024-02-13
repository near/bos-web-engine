interface PackageCompatibility {
  name: string;
  demoLink: string;
  note?: JSX.Element | string;
}

const functionalAsExpected: PackageCompatibility[] = [
  {
    name: 'Lodash',
    demoLink: '/bwe-demos.near/NPM.Lodash?showCode=true',
  },
  {
    name: 'React Hook useMemo',
    demoLink: '/bwe-demos.near/NPM.React.Hooks.UseMemo?showCode=true',
  },
  {
    name: 'React Syntax Highlighter',
    demoLink: '/bwe-demos.near/NPM.ReactSyntaxHighlighter?showCode=true',
  },
];

const functionalWithCaveat: PackageCompatibility[] = [
  {
    name: 'Phosphor Icons',
    demoLink: '/bwe-demos.near/NPM.PhosphorIcons?showCode=true',
    note: 'Icons should use a deep import to avoid network requests for every icon simultaneously',
  },
];

const partialSupport: PackageCompatibility[] = [];

const notCompatible: PackageCompatibility[] = [
  {
    name: 'Zustand',
    demoLink: '/bwe-demos.near/NPM.Zustand?showCode=true',
    note: (
      <span>
        BOS Web Engine plans to support cross-component global state management:{' '}
        <a href="https://github.com/near/bos-web-engine/issues/18">#18</a>
      </span>
    ),
  },
];

const needsTesting: PackageCompatibility[] = [
  {
    name: 'React Hook useRef',
    demoLink: '/bwe-demos.near/NPM.React.Hooks.UseRef?showCode=true',
  },
];

export default function () {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>NPM Package Compatibility</h1>
      <PackageSection
        name="Functional as Expected"
        packageCompats={functionalAsExpected}
      />
      <PackageSection
        name="Functional w/ Caveat"
        packageCompats={functionalWithCaveat}
      />
      <PackageSection name="Partial Support" packageCompats={partialSupport} />
      <PackageSection name="Not Compatible" packageCompats={notCompatible} />
      <PackageSection name="Needs Testing" packageCompats={needsTesting} />
    </div>
  );
}

function PackageSection({
  name,
  packageCompats,
}: {
  name: string;
  packageCompats: PackageCompatibility[];
}) {
  if (!packageCompats.length) {
    return <div></div>;
  }
  return (
    <div>
      <h2>{name}</h2>
      <ul>
        {packageCompats.map((p) => {
          return (
            <Component
              trust={{ mode: 'trusted' }}
              src="bwe-demos.near/NPM.Tracker.ComponentEntry"
              id={p.name}
              key={p.name}
              props={{ ...p }}
            />
          );
        })}
      </ul>
    </div>
  );
}
