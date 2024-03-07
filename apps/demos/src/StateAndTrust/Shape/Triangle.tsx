import s from './styles.module.css';

type Props = {
  color: string;
  icon: string;
  iconColor: string;
  onClick: () => {};
  size: string;
};

function Triangle(props: Props) {
  return (
    <div
      onClick={props.onClick}
      className={s.triangle}
      style={{
        '--shape-size': props.size,
        '--shape-color': props.color,
      }}
    >
      <span className={s.icon}>{props.icon}</span>
    </div>
  );
}

export default Triangle as BWEComponent<Props>;