type ContainerStorageEntry = string | number | object | null;

function buildStorageKey(componentId: string, key: string) {
  return `component_storage/${componentId}/${key}`;
}

async function getItem(componentId: string, key: string) {
  const storageKey = buildStorageKey(componentId, key);
  const valueFromStorage = localStorage.getItem(storageKey);
  if (!valueFromStorage) {
    return null;
  }

  return JSON.parse(valueFromStorage)?.value;
}

async function removeItem(componentId: string, key: string) {
  const storageKey = buildStorageKey(componentId, key);

  return localStorage.removeItem(storageKey);
}

async function setItem(
  componentId: string,
  key: string,
  value: ContainerStorageEntry
) {
  const storageKey = buildStorageKey(componentId, key);

  return localStorage.setItem(storageKey, JSON.stringify({ value }));
}

const ContainerStorage = {
  getItem,
  removeItem,
  setItem,
};

export default ContainerStorage;
