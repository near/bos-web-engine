import { useEffect, useRef } from 'react';
export default function Stateful() {
  const input = useRef(null);
  useEffect(() => {
    console.log('setting focus on input...', input.current);
    input.current.focus();
  }, []);

  return (
    <>
      <input ref={input} type="text" />
    </>
  );
}
