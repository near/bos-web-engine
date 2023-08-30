export function inlineGlobalDefinition(name: string, fn: Function) {
  if (name === fn.name) {
    return fn.toString();
  }

  return `
    ${fn.toString()}
    window.${name} = ${fn.name};
  `;
}
