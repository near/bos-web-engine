export function buildUseComponentCallback(renderComponent: () => void) {
  const callbackMap = new Map<string, any>();

  return function useComponentCallback(callback: (...args: any[]) => Promise<any>, ...args: any[]) {
    return function() {
      if (typeof callback !== 'function') {
        return;
      }

      const key = JSON.stringify({ callback: callback.name, args });
      if (callbackMap.has(key)) {
        return callbackMap.get(key);
      }

      callbackMap.set(key, undefined);
      callback(...args)
        .then((res) => {
          callbackMap.set(key, res);
          renderComponent();
        })
        .catch(console.error);
    };
  };
}
