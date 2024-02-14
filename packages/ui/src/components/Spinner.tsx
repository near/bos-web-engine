import s from './Spinner.module.css';

type Props = {
  size?: string;
};

export function Spinner({ size }: Props) {
  return <div className={s.spinner} style={{ width: size, height: size }} />;
}
