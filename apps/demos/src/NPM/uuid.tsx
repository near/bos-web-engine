import { useState, useEffect } from 'react';
import s from './uuid.module.css';
import { v4 as uuidv4 } from 'uuid';

type Props = {
  inCount?: number;
};

function MyComponent({ inCount = 5 }: Props) {
  const [ids, setIds] = useState<string[]>([]);
  const [count, setCount] = useState(inCount);

  useEffect(() => {
    setIds(Array.from({ length: count }, () => uuidv4()));
  }, [count]);

  return (
    <div className={s.wrapper}>
      <div className={s.input}>
        <div>Count:</div>
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
      </div>
      {ids.map((id) => (
        <div key={id} className={s.uuid}>
          {id}
        </div>
      ))}
    </div>
  );
}

export default MyComponent as BWEComponent<Props>;
