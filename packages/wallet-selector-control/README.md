# BWE Wallet Selector Control

This package provides a convenient UI to show the currently signed in wallet (or allow a user to sign in). It also provides a convenient way to initialize the wallet selector and access that instance via a provider and hook.

## Usage

Please check out the [Standard Usage](../social-db-api/README.md) section for the Social SDK to see a detailed example.

## Hooks

This package also includes the following hooks for convenience:

- `useWallet()` for easily accessing the Wallet Selector instance (and state) shared by the provider.

*NOTE: These hooks aren't accessible in the root of your application due to being outside the context of the providers (they would throw an error). Consider using the `onProvision` prop as shown above or move the consumers of these hooks into a child component of the providers.*
