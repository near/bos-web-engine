import s from './styles.module.css';
import TrustedStyleBugChild from './TrustedStyleBugChild';

function TrustedStyleBugParent() {
  return (
    <div className={s.wrapper}>
      <p>Parent (Trusted Author)</p>
      <TrustedStyleBugChild trust={{ mode: 'trusted-author' }} />

      <hr />

      <p>Parent (Not Trusted)</p>
      <TrustedStyleBugChild />
    </div>
  );
}

export default TrustedStyleBugParent as BWEComponent;
