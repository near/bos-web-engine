import Markdown from 'marked-react';

export function BWEComponent() {
  return <Markdown>{props.content}</Markdown>;
}
