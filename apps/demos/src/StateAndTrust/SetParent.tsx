import ShapeSet from './ShapeSet';

interface Props {
  circle: string;
  id: string;
  square: string;
  triangle: string;
  updateCircle: () => {};
  updateSquare: () => {};
  updateTriangle: () => {};
}

export default function BWEComponent(props: Props) {
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
      <ShapeSet
        id={id}
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
