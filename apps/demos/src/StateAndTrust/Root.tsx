import TrustTree from './TrustTree';

export default function BWEComponent() {
  return (
    <>
      <div className="row">
        <p>
          Click on any shape to trigger a state change in the root Component.
          These state changes will then propagate down to its descendants as
          props.
        </p>
      </div>
      <div className="row">
        <div className="col">
          <TrustTree
            id="trusted"
            trust={{ mode: 'trusted-author' }}
            props={{ title: 'State across Trusted Components' }}
          />
        </div>
        <div className="col">
          <TrustTree
            id="sandboxed"
            props={{ title: 'State within Sandboxed Components' }}
          />
        </div>
      </div>
    </>
  );
}
