import Circle from './Shape/Circle';
import Square from './Shape/Square';
import Triangle from './Shape/Triangle';

interface Props {
  circle: string;
  square: string;
  triangle: string;
  updateCircle: () => {};
  updateSquare: () => {};
  updateTriangle: () => {};
}

export default function BWEComponent(props: Props) {
  return (
    <div className="row" style={{ padding: '8px 4px' }}>
      <div className="col">
        <Circle
          id="circle"
          props={{
            color: '#C1200B',
            iconColor: 'white',
            icon: props.circle || 'circle',
            radius: 40,
            onClick: props.updateCircle,
          }}
        />
      </div>
      <div className="col">
        <Square
          id="square"
          props={{
            color: '#4A825A',
            iconColor: 'white',
            icon: props.square || 'square',
            length: 80,
            onClick: props.updateSquare,
          }}
        />
      </div>
      <div className="col">
        <Triangle
          id="triangle"
          props={{
            color: '#0A81D1',
            iconColor: 'white',
            icon: props.triangle || 'triangle',
            height: 80,
            onClick: props.updateTriangle,
          }}
        />
      </div>
    </div>
  );
}
