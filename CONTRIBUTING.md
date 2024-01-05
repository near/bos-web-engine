# Contributing

## Branching

Branch directly off `main` and use an appropriate prefix (`feat/`, `chore/`, `fix/`, etc)

## PRs

Use [closing keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword) in PR descriptions to automatically close relevent issues when the PR is merged. E.g. `Closes #10`

## Syncing Component Updates with Engine Updates

As much as possible, please update demo components in `apps/demos` in the same PR as the engine modifications which necessitate the component updates. You may wish to get the engine change portion of your PR reviewed and approved before adding the component changes in case review comments lead to revisions to the implementation or resultant syntax

## Local Development

### Without Local Components

Run `pnpm dev` from the root of the repo to stand up your local `apps/web` instance. This will allow you to test changes to the web app itself or to test changes to the engine while loading components which are published on chain

### With Local Components

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