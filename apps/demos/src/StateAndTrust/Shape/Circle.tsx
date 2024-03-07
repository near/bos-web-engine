import s from './styles.module.css';

type Props = {
  color: string;
  icon: string;
  iconColor: string;
  onClick: () => {};
  size: string;
};

function Circle(props: Props) {
  return (
    <div
      onClick={props.onClick}
      className={s.circle}
      style={{
        '--shape-size': props.size,
        '--shape-color': props.color,
      }}
    >
      <span className={s.icon}>{props.icon}</span>
    </div>
  );
}

export default Circle as BWEComponent<Props>;