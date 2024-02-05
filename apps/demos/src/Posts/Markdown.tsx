import Markdown from 'marked-react';

interface Props {
  content: string;
}

export function BWEComponent(props: Props) {
  return <Markdown>{props.content}</Markdown>;
}
