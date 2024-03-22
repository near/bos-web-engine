import TrustTree from './TrustTree';
import s from './styles.module.css';

function StateAndTrust() {
  return (
    <div className={s.wrapper}>
      <div className={s.container}>
        <p>
          Click on any shape to trigger a state change in the root component,
          which will set that shape to a random letter. These state changes will
          then propagate down to its descendants as props.
        </p>

        <p>
          <a href="?showContainerBoundaries=true">View Container Boundaries</a>
        </p>

        <div className={s.grid}>
          <TrustTree
            key="trusted"
            bwe={{ trust: { mode: 'trusted-author' } }}
            title="State across Trusted Components"
          />
          <TrustTree
            key="sandboxed"
            title="State within Sandboxed Components"
          />
        </div>
      </div>
    </div>
  );
}

export default StateAndTrust as BWEComponent;
