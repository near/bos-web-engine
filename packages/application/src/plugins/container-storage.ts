function getStorageKey(componentId: string, key: string) {
  return `component_storage/${componentId}/${key}`;
}

async function getItem(componentId: string, key: string) {
  return localStorage.getItem(getStorageKey(componentId, key));
}

async function removeItem(componentId: string, key: string) {
  return localStorage.removeItem(getStorageKey(componentId, key));
}

async function setItem(componentId: string, key: string, value: string) {
  return localStorage.setItem(getStorageKey(componentId, key), value);
}

const ContainerStorage = {
  getItem,
  removeItem,
  setItem,
};

export default ContainerStorage;
