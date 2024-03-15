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
  return (
    <ShapeSet
      key={props.id}
      circle={props.circle}
      square={props.square}
      triangle={props.triangle}
      updateCircle={props.updateCircle}
      updateSquare={props.updateSquare}
      updateTriangle={props.updateTriangle}
    />
  );
}

export default SetParent as BWEComponent<Props>;
