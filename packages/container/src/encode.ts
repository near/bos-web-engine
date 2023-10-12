export function encodeJsonString(value: string) {
  if (!value) {
    return value;
  }

  return value.toString().replace(/\n/g, '⁣').replace(/\t/g, '⁤');
}

export function decodeJsonString(value: string) {
  if (!value) {
    return value;
  }

  return value.toString().replace(/⁣/g, '\n').replace(/⁤/g, '\t');
}
