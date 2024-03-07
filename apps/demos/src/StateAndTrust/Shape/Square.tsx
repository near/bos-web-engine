import s from './styles.module.css';

type Props = {
  color: string;
  icon: string;
  iconColor: string;
  onClick: () => {};
  size: string;
};

function Square(props: Props) {
  return (
    <div
      onClick={props.onClick}
      className={s.square}
      style={{
        '--shape-size': props.size,
        '--shape-color': props.color,
      }}
    >
      <span className={s.icon}>{props.icon}</span>
    </div>
  );
}

export default Square as BWEComponent<Props>;