function getItem(key: string) {
  return localStorage.getItem(key);
}

function removeItem(key: string) {
  return localStorage.removeItem(key);
}

function setItem(key: string, value: string) {
  return localStorage.setItem(key, value);
}

const ContainerStorage = {
  getItem,
  removeItem,
  setItem,
};

export default ContainerStorage;
