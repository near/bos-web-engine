# Contributing

## Branching

Branch directly off `main` and use an appropriate prefix (`feat/`, `chore/`, `fix/`, etc)

## PRs

Use [closing keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword) in PR descriptions to automatically close relevent issues when the PR is merged. E.g. `Closes #10`

## Syncing Component Updates with Engine Updates

As much as possible, please update demo components in `apps/demos` in the same PR as the engine modifications which necessitate the component updates. You may wish to get the engine change portion of your PR reviewed and approved before adding the component changes, in case review comments lead to alterations to the implementation or resultant syntax

## Local Development

Run `pnpm dev` from the root of the repo.

If you are going to make changes which require testing by writing or updating components:
- Install the latest release of [bos-loader](https://github.com/near/bos-loader)
- Run both Run `pnpm dev` from the root of the repo and `pnpm serve` from `apps/demos`
- Open the web app and modify the browser URL directly to get to `/flags`
- Set the bos-loader URL (shown in bos-loader output)
- Open the component you are editing locally
- TODO
