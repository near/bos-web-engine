// 1. import `NextUIProvider` component
import { NextUIProvider, Spinner } from '@nextui-org/react';
import { Button } from '@nextui-org/button';
import { useState } from 'react';

export default function App() {
  const [value, setValue] = useState(0);
  // 2. Wrap NextUIProvider at the root of your app
  return (
    <NextUIProvider>
      <>
        <span>{value}</span>
        <Button onClick={() => setValue((v) => v + 1)}>next!</Button>
        <Spinner />
      </>
    </NextUIProvider>
  );
}
