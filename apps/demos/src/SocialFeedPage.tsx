import { useEffect, useState } from 'react';
import Button from './Button';
import Post, { type PostProps } from './Post';
import s from './SocialFeedPage.module.css';

type GraphqlResponse = {
  data: {
    dataplatform_near_social_feed_moderated_posts: PostProps[];
    dataplatform_near_social_feed_moderated_posts_aggregate: {
      aggregate: {
        count: number;
      };
    };
  };
};

const GRAPHQL_ENDPOINT = 'https://near-queryapi.api.pagoda.co';
const LIMIT = 10;

function SocialFeedPage() {
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<PostProps[]>([]);

  const fetchGraphQL = async (
    operationsDoc: string,
    operationName: string,
    variables: Record<string, any>
  ) => {
    const response = await fetch(`${GRAPHQL_ENDPOINT}/v1/graphql`, {
      method: 'POST',
      headers: { 'x-hasura-role': 'dataplatform_near' },
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName,
      }),
    });
    const result: GraphqlResponse = await response.json();
    return result;
  };

  const createQuery = () => {
    const indexerQueries = `
      query GetPostsQuery($offset: Int, $limit: Int) {
        dataplatform_near_social_feed_moderated_posts(order_by: [{ block_height: desc }], offset: $offset, limit: $limit) {
          account_id
          block_height
          block_timestamp
          content
          receipt_id
          accounts_liked
          last_comment_timestamp
          comments(order_by: {block_height: asc}) {
            account_id
            block_height
            block_timestamp
            content
          }
          verifications {
            human_provider
            human_valid_until
            human_verification_level
          }
        }
        dataplatform_near_social_feed_moderated_posts_aggregate {
          aggregate {
            count
          }
        }
      }
    `;

    return indexerQueries;
  };

  const loadMorePosts = async () => {
    try {
      const queryName = 'GetPostsQuery';

      setLoading(true);

      const { data } = await fetchGraphQL(createQuery(), queryName, {
        offset: posts.length,
        limit: LIMIT,
      });

      if (data) {
        const newPosts = data.dataplatform_near_social_feed_moderated_posts;
        if (newPosts.length > 0) {
          let filteredPosts = newPosts;
          setPosts([...posts, ...filteredPosts]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMorePosts();
  }, []);

  return (
    <div className={s.wrapper}>
      <div className={s.container}>
        <h1>Latest Posts</h1>

        <div className={s.posts}>
          {posts.map((post) => {
            return <Post {...post} key={post.receipt_id} />;
          })}
        </div>

        <div className={s.footer}>
          <Button
            bwe={{ trust: { mode: 'trusted' } }}
            onClick={loadMorePosts}
            disabled={loading}
          >
            Load More
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SocialFeedPage as BWEComponent;
