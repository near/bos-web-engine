import s from './styles.module.css';
import ChildComponent from './TrustStateBugChild';

function ParentComponent() {
  return (
    <div className={s.wrapper}>
      <p>Parent. This will dissappear when you click the button.</p>
      <ChildComponent trust={{ mode: 'trusted-author' }} />
    </div>
  );
}

export default ParentComponent as BWEComponent;
