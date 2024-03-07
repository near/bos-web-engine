import ShapeSet from './ShapeSet';

type Props = {
  circle: string;
  id: string;
  square: string;
  triangle: string;
  updateCircle: () => any;
  updateSquare: () => any;
  updateTriangle: () => any;
};

function SetParent(props: Props) {
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
  );
}

export default SetParent as BWEComponent<Props>;