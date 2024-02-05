import s from './Loading.module.css';

type Props = {
  message?: string;
};

export function Loading({ message }: Props) {
  return (
    <div className={s.wrapper}>
      <div className={s.spinner} />

      <p>{message ?? 'Loading...'}</p>
    </div>
  );
}
