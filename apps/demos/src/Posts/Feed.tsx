import { useEffect, useState } from 'react';

export function BWEComponent() {
  const GRAPHQL_ENDPOINT = 'https://near-queryapi.api.pagoda.co';

  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  interface PostsResponse {
    data: {
      dataplatform_near_social_feed_moderated_posts: Post[];
      dataplatform_near_social_feed_moderated_posts_aggregate: {
        aggregate: {
          count: number;
        };
      };
    };
  }

  interface Post {
    account_id: string;
    block_height: number;
    block_timestamp: number;
    content: string;
    receipt_id: string;
    accounts_liked: string[];
    last_comment_timestamp: number;
    comments: {
      account_id: string;
      block_height: number;
      block_timestamp: string;
      content: string;
    }[];
    verifications: {
      human_provider: string;
      human_valid_until: string;
      human_verification_level: string;
    }[];
  }

  const a = 1;
  console.log(a);

  async function fetchGraphQL(
    operationsDoc,
    operationName,
    variables
  ): Promise<PostsResponse> {
    const response = await fetch(`${GRAPHQL_ENDPOINT}/v1/graphql`, {
      method: 'POST',
      headers: { 'x-hasura-role': 'dataplatform_near' },
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName,
      }),
    });
    const result: PostsResponse = await response.json();
    return result;
  }

  const createQuery = (type) => {
    let querySortOption = '';
    switch (sort) {
      case 'recentcommentdesc':
        querySortOption = `{ last_comment_timestamp: desc_nulls_last },`;
        break;
      // More options...
      default:
        querySortOption = '';
    }

    let queryFilter = '';
    // switch (type) {
    //   case "following":
    //     let queryAccountsString = accountsFollowing
    //       .map((account) => `"${account}"`)
    //       .join(", ");
    //     queryFilter = `account_id: { _in: [${queryAccountsString}]}`;
    //     break;
    //   // More options...
    //   default:
    //     queryFilter = "";
    // }

    const indexerQueries = `
query GetPostsQuery($offset: Int, $limit: Int) {
  dataplatform_near_social_feed_moderated_posts(order_by: [${querySortOption} { block_height: desc }], offset: $offset, limit: $limit) {
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
query GetFollowingPosts($offset: Int, $limit: Int) {
  dataplatform_near_social_feed_moderated_posts(where: {${queryFilter}}, order_by: [{ block_height: desc }], offset: $offset, limit: $limit) {
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
  dataplatform_near_social_feed_moderated_posts_aggregate(where: {${queryFilter}}) {
    aggregate {
      count
    }
  }
}
`;
    return indexerQueries;
  };

  const loadMorePosts = () => {
    // const queryName =
    // state.selectedTab === "following" ? "GetFollowingPosts" : "GetPostsQuery";
    const queryName = 'GetPostsQuery';
    // const type = state.selectedTab;
    const type = null;

    // if (state.selectedTab === "following" && !accountsFollowing) {
    //   return;
    // }

    // State.update({
    //   isLoading: true,
    // });
    setLoading(true);

    fetchGraphQL(createQuery(type), queryName, {
      offset: posts.length,
      // limit: LIMIT,
      limit: 10,
    }).then(({ data }) => {
      // if (result.status === 200 && result.body) {
      // if (result.body.errors) {
      //   console.log("error:", result.body.errors);
      //   return;
      // }
      // let data = result.body.data;
      if (data) {
        const newPosts = data.dataplatform_near_social_feed_moderated_posts;
        const postsCountLeft =
          data.dataplatform_near_social_feed_moderated_posts_aggregate.aggregate
            .count;
        if (newPosts.length > 0) {
          // let filteredPosts = newPosts.filter((i) => !shouldFilter(i));
          // filteredPosts = filteredPosts.map((post) => {
          //   const prevComments = post.comments;
          //   const filteredComments = prevComments.filter(
          //     (comment) => !shouldFilter(comment)
          //   );
          //   post.comments = filteredComments;
          //   return post;
          // });
          let filteredPosts = newPosts;

          // State.update({
          //   isLoading: false,
          //   posts: [...state.posts, ...filteredPosts],
          //   postsCountLeft,
          // });
          console.log('filteredPosts', filteredPosts);
          setPosts([...posts, ...filteredPosts]);
          setLoading(false);
        }
      }
      // }
    });
  };

  useEffect(() => {
    loadMorePosts();
  }, []);

  // @ts-ignore
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
        maxWidth: '1300px',
        margin: '0 auto',
      }}
    >
      <Component src="bwe-demos.near/Posts.Sidebar" id="left" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          rowGap: '2rem',
          padding: '1rem',
          flex: '1 1',
          overflowX: 'hidden',
        }}
      >
        {posts?.length ? (
          posts.map((post) => {
            return (
              <div>
                <Component
                  src="bwe-demos.near/Posts.Post"
                  props={post}
                  id={post.receipt_id}
                />
                {/* <div>{post.comments?.length}</div> */}
              </div>
            );
          })
        ) : (
          <></>
        )}
        {!loading && <button onClick={loadMorePosts}>Load more</button>}
      </div>
      <Component src="bwe-demos.near/Posts.Sidebar" id="right" />
    </div>
  );
}
