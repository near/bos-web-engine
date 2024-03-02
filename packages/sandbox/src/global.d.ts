declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.txt' {
  const source: string;
  export default source;
}
