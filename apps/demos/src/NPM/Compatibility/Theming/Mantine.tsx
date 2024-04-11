import { MantineProvider, Slider } from '@mantine/core';

const marks = [
  { value: 20, label: '20%' },
  { value: 50, label: '50%' },
  { value: 80, label: '80%' },
];

export default function Demo() {
  return (
    <MantineProvider>
      <Slider defaultValue={40} marks={marks} />
    </MantineProvider>
  );
}
