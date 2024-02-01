interface Props {
  account_id: string;
  block_timestamp: number;
  content: string;
}

export function BWEComponent(props: Props) {
  const { content: contentRaw, account_id: author, block_timestamp } = props;

  let content = 'bad content';
  console.log(contentRaw);
  try {
    content = JSON.parse(contentRaw).text;
  } catch (e) {
    console.log('error parsing content', e);
  }

  // debugger;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '100%',
        borderBottom: '1px solid #e7e7e7',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          columnGap: '0.5rem',
          alignItems: 'center',
        }}
      >
        <Component
          src="bwe-demos.near/Posts.Account"
          props={{ account: author }}
        />
        <span style={{ color: 'gray' }}>
          {new Date(block_timestamp / 1000000).toLocaleString()}
        </span>
      </div>
      <Component
        src="bwe-demos.near/Posts.Markdown"
        props={{ content }}
        // id={post.receipt_id}
      />
    </div>
  );
}
