import { useEffect } from 'react';

import { useDevToolsStore } from '@/stores/dev-tools';

type Props = {
  onHotReloadRequested: () => void;
};

export const HotReload = ({ onHotReloadRequested }: Props) => {
  const { hotReloadWebsocketUrl } = useDevToolsStore((state) => state.flags);

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
};
