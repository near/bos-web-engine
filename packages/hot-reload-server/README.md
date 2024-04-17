# Hot Reload Server

This is an experimental feature to improve DX when authoring RoC components in a local IDE - such as VS Code. Whenever a file is changed, this package will emit a websocket event to the `web` gateway, which will then trigger a refresh of all local components served by `bos-loader`.

It could make sense to move this feature into the `bos-loader` package itself once we feel confident in this hot reloading flow.

## Usage

First, navigate to the root of the repository in your CLI. Make sure the `apps/web` Next JS app isn't already running (if it is, quit that process). Then you'll run:

```bash
SOURCE_PATH=bos-web-engine/apps/demos/src pnpm dev:components
```

You should see the following output:

```
@bos-web-engine/hot-reload-server:dev:components: Hot reload websocket server is running on: ws://localhost:4000
@bos-web-engine/hot-reload-server:dev:components: Resolved path for hot reload watch: /Users/.../bos-web-engine/apps/demos/src
```

The `SOURCE_PATH` is relative to the parent directory of `bos-web-engine` to make it a bit easier to reference a path that lives outside of the monorepo. If you've cloned the [RoC Components](https://github.com/near/near-roc-components) repository next to the `bos-web-engine` repo, you'd use this path instead:

```bash
SOURCE_PATH=near-roc-components/src
```

The `pnpm dev:components` command does two things:

1. Starts up the hot reload websocket server
2. Starts up the `apps/web` gateway

Now you'll need to open up the gateway in your browser - which should be `localhost:3000`. Open up the `Dev Tools` drawer in the bottom right of your screen and navigate to the `Flags` tab. Enter the following:

1. Enter a value for `bos-loader URL`. This should be `http://localhost:3030`
2. Enter a value for `Hot Reload URL`. This should be `ws://localhost:4000`
3. Save the URL's

Now, open up one of your components in your local gateway. EG: `http://localhost:3000/bwe-demos.near/LandingPage`. Then make a visual change to `LandingPage.tsx` and you should see your changes instantly appear in your browser without having to reload it!

If you run into conflicts with the default `port` values, you can pass a custom port for the hot reload server (don't forget to update your `Flags` in the `Dev Tools`!):

```bash
HOT_RELOAD_PORT=1234 SOURCE_PATH=apps/demos/src pnpm dev:components
```

## Troubleshooting

### SOURCE_PATH

If the hot reload flow isn't working, double check the log output value of `Resolved path for hot reload watch: ...` when you start up the `pnpm dev:components` script. This shows the fully resolved path for where the hot reload server is watching for changes. If the logged path isn't correct, try adjusting the passed `SOURCE_PATH` value.

### Console Warning

You might see the following warning in your console when viewing the local gateway:

```
HotReload.tsx:25 WebSocket connection to 'ws://localhost:4000/' failed: WebSocket is closed before the connection is established.
```

You can safely ignore this warning. This happens due to React 18's strict mode calling all `useEffect()` hooks twice. The websocket connection logic ends up running twice due to this and instantly closes the first connection in the `useEffect()` cleanup - which generates the warning. This warning comes directly from the browser and apparently can't be suppressed.
