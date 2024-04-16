import { useEffect, useState } from 'react';
import ContainerStoragePlugin from '@bos-web-engine/container-storage-plugin';

import s from './ContainerStorage.module.css';

function ContainerStorage() {
  const [value, setValue] = useState(0);

  const updateValueFromContainerStorage = async () => {
    const valueFromContainerStorage =
      await ContainerStoragePlugin.getItem('exampleKey');
    setValue(Number(valueFromContainerStorage) || 0);
  };

  useEffect(() => {
    updateValueFromContainerStorage();
  }, []);

  const handleIncrement = () => {
    const newValue = Number(value) + 1;
    ContainerStoragePlugin.setItem('exampleKey', String(newValue));
    setValue(newValue);
  };

  const handleReset = () => {
    ContainerStoragePlugin.removeItem('exampleKey');
    setValue(0);
  };

  return (
    <div className={s.wrapper}>
      <h1>Value: {value}</h1>
      <button className={s.btn} onClick={handleIncrement}>
        Increment value
      </button>
      <button className={s.btn} onClick={handleReset}>
        Reset value
      </button>
    </div>
  );
}

export default ContainerStorage as BWEComponent;
