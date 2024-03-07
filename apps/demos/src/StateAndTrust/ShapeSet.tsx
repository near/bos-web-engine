import s from './styles.module.css';

import Circle from './Shape/Circle';
import Square from './Shape/Square';
import Triangle from './Shape/Triangle';

type Props = {
  circle: string;
  square: string;
  triangle: string;
  updateCircle: () => any;
  updateSquare: () => any;
  updateTriangle: () => any;
};

function ShapeSet(props: Props) {
  return (
    <div className={s.wrapper}>
      <Circle
        id="circle"
        props={{
          color: '#b54548',
          iconColor: 'white',
          icon: props.circle,
          onClick: props.updateCircle,
          size: "4rem",
        }}
      />
      <Square
        id="square"
        props={{
          color: '#30a46c',
          iconColor: 'white',
          icon: props.square,
          onClick: props.updateSquare,
          size: "4rem",
        }}
      />
      <Triangle
        id="triangle"
        props={{
          color: '#00a2c7',
          iconColor: 'white',
          icon: props.triangle,
          onClick: props.updateTriangle,
          size: "4rem",
        }}
      />
    </div>
  );
}

export default ShapeSet as BWEComponent<Props>;