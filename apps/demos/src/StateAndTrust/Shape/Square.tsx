interface Props {
  color: string;
  icon: string;
  length: number;
  iconColor: string;
  onClick: () => {};
}

export default function BWEComponent(props: Props) {
  const lengthPx = `${props.length}px`;
  return (
    <div
      onClick={props.onClick}
      style={{
        width: lengthPx,
        height: lengthPx,
        backgroundColor: props.color,
        textAlign: 'center',
      }}
    >
      <i
        className={`bi-${props.icon}`}
        style={{
          color: props.iconColor,
          position: 'relative',
          top: 'calc(50% - 16px)',
        }}
      />
    </div>
  );
}
