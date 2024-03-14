import { useEffect, useState } from 'react';
import s from './styles.module.css';
import Button from './Button';

const DISPLAY_LIMIT = 5;
const GRAPHQL_ENDPOINT = 'https://near-queryapi.api.pagoda.co';

const query = `
  query Versions {
    calebjacob_near_components_alpha_versions(
      order_by: {component_name: asc, component_author_id: asc}
    ) {
      block_height
      block_timestamp_ms
      component_author_id
      component_name
      lines_added
      lines_removed
    }
  }
`;

async function fetchGraphQL(
  operationName: 'Versions',
  variables: Record<string, any>
) {
  const response = await fetch(`${GRAPHQL_ENDPOINT}/v1/graphql`, {
    method: 'POST',
    headers: {
      'x-hasura-role': 'calebjacob_near',
      // This needs to match the account where the indexer is published
      // EG: https://near.org/dataplatform.near/widget/QueryApi.App?selectedIndexerPath=calebjacob.near%2Fcomponents_alpha
    },
    body: JSON.stringify({
      operationName: operationName,
      query,
      variables: variables,
    }),
  });

  const data = await response.json();

  return data;
}

type Version = {
  block_height: number;
  block_timestamp_ms: number;
  component_author_id: string;
  component_name: string;
  lines_added: number;
  lines_removed: number;
};

type Component = {
  accountId: string;
  componentName: string;
  lastPublishTimestampMs: number;
  totalVersions: number;
};

type Developer = {
  accountId: string;
  componentNames: string[];
  lastPublishTimestampMs: number;
  totalVersions: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
};

function AlphaDashboard() {
  const [components, setComponents] = useState<Component[] | null>(null);
  const [developers, setDevelopers] = useState<Developer[] | null>(null);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [totalLinesAdded, setTotalLinesAdded] = useState<number | null>(null);
  const [totalLinesRemoved, setTotalLinesRemoved] = useState<number | null>(
    null
  );
  const [componentsSorting, setComponentsSorting] = useState<
    'ALPHABETICAL' | 'RECENT'
  >('RECENT');
  const [developersSorting, setDevelopersSorting] = useState<
    'ALPHABETICAL' | 'RECENT'
  >('RECENT');
  const [showAllComponents, setSowAllComponents] = useState(false);
  const [showAllDevelopers, setSowAllDevelopers] = useState(false);

  // The query already returns developers in ALPHABETICAL sorting, so we only need logic for RECENT
  const sortedDevelopers = developers ? [...developers] : null;
  if (sortedDevelopers && developersSorting === 'RECENT') {
    sortedDevelopers.sort(
      (a, b) => b.lastPublishTimestampMs - a.lastPublishTimestampMs
    );
  }
  const sortedComponents = components ? [...components] : null;
  if (sortedComponents && componentsSorting === 'RECENT') {
    sortedComponents.sort(
      (a, b) => b.lastPublishTimestampMs - a.lastPublishTimestampMs
    );
  }

  useEffect(() => {
    const loadVersions = async () => {
      const { data } = await fetchGraphQL('Versions', {});
      setVersions(data.calebjacob_near_components_alpha_versions);
    };

    loadVersions();
  }, []);

  useEffect(() => {
    if (!versions) return;

    const componentsByPath: {
      [componentPath: string]: Component | undefined;
    } = {};

    const developersById: {
      [accountId: string]: Developer | undefined;
    } = {};

    let totalLinesAdded = 0;
    let totalLinesRemoved = 0;

    versions.forEach((version) => {
      const accountId = version.component_author_id;
      const componentPath =
        version.component_author_id + version.component_name;

      const component = componentsByPath[componentPath] ?? {
        accountId: version.component_author_id,
        componentName: version.component_name,
        lastPublishTimestampMs: 0,
        totalVersions: 0,
      };

      const developer = developersById[accountId] ?? {
        accountId,
        lastPublishTimestampMs: 0,
        componentNames: [],
        totalVersions: 0,
        totalLinesAdded: 0,
        totalLinesRemoved: 0,
      };

      component.lastPublishTimestampMs = Math.max(
        version.block_timestamp_ms,
        component.lastPublishTimestampMs
      );
      component.totalVersions++;

      developer.lastPublishTimestampMs = Math.max(
        version.block_timestamp_ms,
        developer.lastPublishTimestampMs
      );
      developer.totalLinesAdded += version.lines_added;
      developer.totalLinesRemoved += version.lines_removed;
      developer.totalVersions++;

      totalLinesAdded += version.lines_added;
      totalLinesRemoved += version.lines_removed;

      if (developer.componentNames.indexOf(version.component_name) === -1) {
        developer.componentNames.push(version.component_name);
      }

      componentsByPath[componentPath] = component;
      developersById[accountId] = developer;
    });

    setComponents(Object.values(componentsByPath) as Component[]);
    setDevelopers(Object.values(developersById) as Developer[]);
    setTotalLinesAdded(totalLinesAdded);
    setTotalLinesRemoved(totalLinesRemoved);
  }, [versions]);

  return (
    <div className={s.wrapper}>
      <div className={s.container}>
        <h1 className={s.title}>BWE Alpha Dashboard</h1>

        <div className={s.totals}>
          <div className={s.card}>
            <p className={s.label}>Developers</p>
            <p className={s.total}>{developers?.length ?? '...'}</p>
          </div>
          <div className={s.card}>
            <p className={s.label}>Components</p>
            <p className={s.total}>{components?.length ?? '...'}</p>
          </div>
          <div className={s.card}>
            <p className={s.label}>Versions</p>
            <p className={s.total}>{versions?.length ?? '...'}</p>
          </div>
          <div className={s.card}>
            <p className={s.label}>Lines</p>
            <div>
              <p className={s.totalLinesAdded}>+{totalLinesAdded ?? '...'}</p>
              <p className={s.totalLinesRemoved}>
                -{totalLinesRemoved ?? '...'}
              </p>
            </div>
          </div>
        </div>

        <hr />

        <h3>All Developers</h3>

        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.sorting}>
              <label className={s.checkbox} title="Based on last publish">
                <input
                  type="radio"
                  name="developersSorting"
                  checked={developersSorting === 'RECENT'}
                  value="RECENT"
                  onChange={() => setDevelopersSorting('RECENT')}
                />
                Recent
              </label>
              <label className={s.checkbox}>
                <input
                  type="radio"
                  name="developersSorting"
                  checked={developersSorting === 'ALPHABETICAL'}
                  value="ALPHABETICAL"
                  onChange={() => setDevelopersSorting('ALPHABETICAL')}
                />
                A-Z
              </label>
            </div>
          </div>

          <div className={s.developers}>
            {sortedDevelopers
              ?.slice(0, showAllDevelopers ? -1 : DISPLAY_LIMIT)
              .map((developer) => (
                <div className={s.developer} key={developer.accountId}>
                  <h4>{developer.accountId}</h4>
                  <div className={s.developerStats}>
                    <span title="Total Components">
                      {developer.componentNames.length}
                    </span>
                    <span title="Total Versions">
                      {developer.totalVersions}
                    </span>
                    <span
                      className={s.totalLinesAdded}
                      title="Total Lines Added"
                    >
                      +{developer.totalLinesAdded}
                    </span>
                    <span
                      className={s.totalLinesRemoved}
                      title="Total Lines Removed"
                    >
                      -{developer.totalLinesRemoved}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {!showAllDevelopers && (developers?.length ?? 0) > DISPLAY_LIMIT && (
            <div className={s.cardFooter}>
              <Button
                id="show-all-developers"
                onClick={() => setSowAllDevelopers(true)}
              >
                {`Show All (${developers?.length})`}
              </Button>
            </div>
          )}
        </div>

        <hr />

        <h3>All Components</h3>

        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.sorting}>
              <label className={s.checkbox} title="Based on last publish">
                <input
                  type="radio"
                  name="componentsSorting"
                  checked={componentsSorting === 'RECENT'}
                  value="RECENT"
                  onChange={() => setComponentsSorting('RECENT')}
                />
                Recent
              </label>
              <label className={s.checkbox}>
                <input
                  type="radio"
                  name="componentsSorting"
                  checked={componentsSorting === 'ALPHABETICAL'}
                  value="ALPHABETICAL"
                  onChange={() => setComponentsSorting('ALPHABETICAL')}
                />
                A-Z
              </label>
            </div>

            <div className={s.legend}>
              <span style={{ color: 'var(--color-new)' }}>• New</span>
              <span style={{ color: 'var(--color-visited)' }}>• Viewed</span>
            </div>
          </div>

          <div className={s.components}>
            {sortedComponents
              ?.slice(0, showAllComponents ? -1 : DISPLAY_LIMIT)
              .map((component) => (
                <div
                  className={s.component}
                  key={component.accountId + component.componentName}
                >
                  <a
                    href={`https://bwe.near.dev/${component.accountId}/${component.componentName}`}
                    target="_blank"
                  >
                    •
                    <span className={s.componentContent}>
                      <span>
                        {component.accountId}/{component.componentName}
                      </span>
                      <span className={s.timestamp} title="Last Published">
                        {new Date(
                          component.lastPublishTimestampMs
                        ).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </span>
                  </a>
                </div>
              ))}
          </div>

          {!showAllComponents && (components?.length ?? 0) > DISPLAY_LIMIT && (
            <div className={s.cardFooter}>
              <Button
                id="show-all-components"
                onClick={() => setSowAllComponents(true)}
              >
                {`Show All (${components?.length})`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlphaDashboard as BWEComponent;
