import { useEffect } from 'react';
import s from './styles.module.css';

const GRAPHQL_ENDPOINT = "https://near-queryapi.api.pagoda.co";

const query = `
  query MyQuery1($limit: Int = 10, $offset: Int = 0) {
    calebjacob_near_components_alpha_versions(limit: $limit, offset: $offset) {
      id
      lines_added
      lines_removed
      component_name
      component_author_id
      block_height
    }
  }

  query MyQuery2($limit: Int = 10, $offset: Int = 0) {
    calebjacob_near_components_alpha_versions(limit: $limit, offset: $offset) {
      id
      lines_added
      lines_removed
    }
  }
`;

async function fetchGraphQL(operationName: 'MyQuery1' | 'MyQuery2', variables: Record<string, any>) {
  const response = await fetch(`${GRAPHQL_ENDPOINT}/v1/graphql`, {
    method: "POST",
    headers: {
      "x-hasura-role": "calebjacob_near"
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

function QueryExample() {
  useEffect(() => {
    const load = async () => {
      const data = await fetchGraphQL("MyQuery1", {
        limit: 5,
        offset: 5
      });

      console.log(data);
    };

    load();
  }, []);

  return (
    <div className={s.wrapper}>
      <p>Check out your browser console to see the logged data that was fetched.</p>
    </div>
  );
}

export default QueryExample as BWEComponent;
