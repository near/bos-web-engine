interface Props {
  circle: string;
  id: string;
  square: string;
  triangle: string;
  updateCircle: () => {};
  updateSquare: () => {};
  updateTriangle: () => {};
}

export function BWEComponent(props: Props) {
  const {
    circle,
    square,
    triangle,
    updateCircle,
    updateSquare,
    updateTriangle,
    id,
  } = props;

  return (
    <div>
      <Component
        id={id}
        src="bwe-demos.near/StateAndTrust.ShapeSet"
        props={{
          circle,
          square,
          triangle,
          updateCircle,
          updateSquare,
          updateTriangle,
        }}
      />
    </div>
  );
}
