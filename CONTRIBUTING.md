# Contributing

## Branching

Branch directly off `main` and use an appropriate prefix (`feat/`, `chore/`, `fix/`, etc)

## PRs

Use [closing keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword) in PR descriptions to automatically close relevent issues when the PR is merged. E.g. `Closes #10`

## Syncing Component Updates with Engine Updates

As much as possible, please update demo components in `apps/demos` in the same PR as the engine modifications which necessitate the component updates. You may wish to get the engine change portion of your PR reviewed and approved before adding the component changes in case review comments lead to revisions to the implementation or resultant syntax

## Local Development

### Environment Setup

#### Node

The two recommended ways to install node are via a node version manager or a VS Code Dev Container. Dev Containers will not be covered here, but feel free to use them if you are familiar with them. Note that they may offer sub-optimal performance on Apple Silicon

Version managers:
- [nvm](https://github.com/nvm-sh/nvm) - most well known and still widely used, but has had issues with performance in the form of significantly increasing shell startup time
- [n](https://github.com/tj/n) - stable alternative. compatible with `.node-version` and `.nvmrc` files
- [fnm](https://github.com/Schniz/fnm) - more recent alternative written in Rust touting improved performance. compatible with `.node-version` and `.nvmrc` files

Check [the root package.json](./package.json) for an engine field defining the minimum supported node version. You should be able to tell your version manager to just install the correct major version to get the latest minor and patch versions. E.g. `nvm install 18` would yield the latest 18.x.x version

#### pnpm

This repo uses [pnpm](https://pnpm.io/) as its package manager, which also handles monorepo workspace management. Although the pnpm website offers multiple installation methods, they result in different major versions being installed. Please install pnpm via `npm install -g pnpm` to be in sync with the team

#### Turborepo

[Turborepo](https://turbo.build/repo) is used for monorepo task orchestration. You do not need to install it yourself nor understand it out of the gate, but it is worth reading up on at some point to understand how our scripts and caching work.

### Running Without Local Components

Run `pnpm dev` from the root of the repo to stand up your local `apps/web` instance. This will allow you to test changes to the web app itself or to test changes to the engine while loading components which are published on chain

### Running With Local Components

If you are going to make changes which require testing by writing or updating components, you can have your locally running `apps/web` instance load components from your local machine:
- Install the latest release of [bos-loader](https://github.com/near/bos-loader) via the script on the Release page
- Run `pnpm dev` from the root of the repo to stand up your local `apps/web` instance
- Run `pnpm serve` from `apps/demos` which will start a bos-loader server and make your local components available to the web app
- Open the web app and modify the browser URL directly to get to `/flags`  
  e.g. if your web at is running at `localhost:3000`, you would navigate to `localhost:3000/flags`
- Set the bos-loader URL which was printed in the bos-loader output

You can now navigate to components by URL, and if that component is made available by bos-loader, it will be loaded from your local machine. In the bos-loader output, you can see the account under which each directory is being served.

`apps/demos/src` is for published demos and tracked by git  
`apps/demos/ignore` is ignored by git and can be used a scratch space for testing components