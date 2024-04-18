import chokidar from 'chokidar';
import path from 'path';
import WebSocket, { WebSocketServer } from 'ws';

const SOURCE_PATH = (process.env.SOURCE_PATH ?? '').replace(/^(\/)(.\/)/, ''); // Make sure we remove any beginning "/" or "./"

if (!SOURCE_PATH) {
  throw new Error(
    'Unable to start hot reload server. Missing required "SOURCE_PATH" env value.'
  );
}

const sourcePath = `../../../${SOURCE_PATH}`;
const resolvedSourcePath = path.resolve(sourcePath);
const port = process.env.HOT_RELOAD_PORT
  ? parseInt(process.env.HOT_RELOAD_PORT)
  : 4000;
const wss = new WebSocketServer({ port });
const emitHotReloadEventDebounced = debounce(emitHotReloadEvent, 50);

console.log(
  `Hot reload websocket server is running on: ws://localhost:${port}`
);
console.log(`Resolved path for hot reload watch: ${resolvedSourcePath}`);

chokidar.watch(resolvedSourcePath).on('all', () => {
  /* 
    The debounce is mainly needed for when this script first starts up. 
    An "add" event is fired off for every existing file and we don't want 
    to emit a reload event for every single file on start up.
  */

  emitHotReloadEventDebounced();
});

function debounce(method: () => any, timeout: number) {
  let timer: NodeJS.Timeout | undefined;

  return () => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      method();
    }, timeout);
  };
}

function emitHotReloadEvent() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('HOT_RELOAD');
    }
  });
}

wss.on('connection', (ws) => {
  ws.on('error', console.error);
});
