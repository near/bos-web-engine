import { Theme, Flex, Text, Button } from '@radix-ui/themes';
// import '@radix-ui/themes/styles.css';

function MyApp() {
  return (
    <Flex direction="column" gap="2">
      <Text>Hello from Radix Themes :)</Text>
      <Button>Let's go</Button>
    </Flex>
  );
}

export default function Radix() {
  console.warn(`
    @radix-ui 
  `);

  return (
    <Theme>
      <MyApp />
    </Theme>
  );
}
