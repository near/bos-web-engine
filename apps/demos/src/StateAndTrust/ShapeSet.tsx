export function BWEComponent() {
  return (
    <div className="row" style={{ padding: '8px 4px' }}>
      <div className="col">
        <Component
          id="circle"
          src="bwe-demos.near/StateAndTrust.Shape.Circle"
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
        <Component
          id="square"
          src="bwe-demos.near/StateAndTrust.Shape.Square"
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
        <Component
          src="bwe-demos.near/StateAndTrust.Shape.Triangle"
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
