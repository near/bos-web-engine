import s from './styles.module.css';
import {useState}from 'react';

function ChildComponent() {
  const [count, setCount] = useState(0);

  const increase = () => setCount((value) => value + 1);

  return (
    <div className={s.wrapper}>
      <button type="button" onClick={increase}>Count: {count}</button>
    </div>
  );
}

export default ChildComponent as BWEComponent;
