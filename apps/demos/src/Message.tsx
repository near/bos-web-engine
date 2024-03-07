import s from './styles.module.css';

type Props = {
  message?: string;
};

function Message({ message = 'Default message...' }: Props) {
  return (
    <div className={s.wrapper}>
      <h2 className={s.title}>Message:</h2>
      <p className={s.message}>{message}</p>
    </div>
  );
}

export default Message as BWEComponent<Props>;
