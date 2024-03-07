import s from './styles.module.css';

function TrustedStyleBugChild() {
  return (
    <div className={s.wrapper}>
      <p>Child</p>
    </div>
  );
}

export default TrustedStyleBugChild as BWEComponent;
