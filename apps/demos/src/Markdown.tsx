import Marked from 'marked-react';
import s from './Markdown.module.css';

type Props = {
  content: string;
}

function Markdown({ content }: Props) {
  return <Marked className={s.wrapper}>{content}</Marked>;
}

export default Markdown as BWEComponent<Props>;