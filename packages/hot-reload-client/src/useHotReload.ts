import { useEffect } from 'react';

export function useHotReload(
  hotReloadWebsocketUrl: string | null | undefined,
  onHotReloadRequested: () => void
) {
  useEffect(() => {
    if (!hotReloadWebsocketUrl) return;

    const socket = new WebSocket(hotReloadWebsocketUrl);

    socket.onmessage = (event) => {
      if (event.data === 'HOT_RELOAD') {
        onHotReloadRequested();
      }
    };

    return () => {
      if (socket.readyState !== 3) {
        socket.close();
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotReloadWebsocketUrl]);

  return null;
}
