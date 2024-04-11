import { ChakraProvider, CircularProgress } from '@chakra-ui/react';

export default function Chakra() {
  console.warn(`
    @chakra-ui/react does not appear to render correctly within iframes. The content can render
    within an iframe using both React and Preact, however there is no animation or interactivity.
    See potentially related issue: https://github.com/chakra-ui/chakra-ui/issues/8241 

    The "Failed to execute 'insertBefore' on 'Node': parameter 1 is not of type 'Node'." error
    occurs only in Preact but it's not clear what causes this error or what impact it has.

    The "Refused to apply inline style..." error is Chakra trying to modify the iframe document,
    which is not explicitly authorized by the iframe's Content Security Policy. It's not clear
    what impact this has as their is not a clear distinction in behavior when authorizing it.
  `);

  return (
    <ChakraProvider>
      <span>content</span>
      <CircularProgress value={30} size="120px" />
    </ChakraProvider>
  );
}
