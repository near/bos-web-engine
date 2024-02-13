export default function ({ name, demoLink, note }) {
  return (
    <li>
      <a key={name} href={demoLink}>
        {name}
      </a>
      {note ? <span>: {note}</span> : ''}
    </li>
  );
}
