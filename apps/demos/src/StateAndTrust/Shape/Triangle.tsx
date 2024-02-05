interface Props {
  color: string;
  height: number;
  icon: string;
  iconColor: string;
  onClick: () => {};
}

export default function BWEComponent(props: Props) {
  return (
    <div
      onClick={props.onClick}
      style={{
        width: 0,
        height: 0,
        borderLeft: `${props.height / 2}px solid transparent`,
        borderRight: `${props.height / 2}px solid transparent`,
        borderBottom: `${props.height}px solid ${props.color}`,
        textAlign: 'center',
      }}
    >
      <i
        className={`bi-${props.icon}`}
        style={{
          color: props.iconColor,
          position: 'relative',
          top: 'calc(50% + 34px)',
          right: 'calc(50% + 9px)',
        }}
      />
    </div>
  );
}
