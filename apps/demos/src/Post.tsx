import Account from './Account';
import Markdown from './Markdown';
import s from './Post.module.css';

export type PostProps = {
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
};

function Post({ content: contentRaw, account_id, block_timestamp }: PostProps) {
  let content = 'bad content';
  try {
    content = JSON.parse(contentRaw).text;
  } catch (e) {
    console.log('error parsing content', e);
  }

  return (
    <div className={s.post}>
      <div className={s.header}>
        <Account props={{ accountId: account_id }} />

        <p className={s.timestamp}>
          {new Date(block_timestamp / 1000000).toLocaleString()}
        </p>
      </div>
      
      <Markdown props={{ content }} />
    </div>
  );
}

export default Post as BWEComponent<PostProps>;