export function BWEComponent() {
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
