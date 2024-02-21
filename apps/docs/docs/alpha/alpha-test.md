# Alpha Test

:::warning
Please use non-vital NEAR accounts during the alpha test since we have not yet initiated our security audit program. Avoid using accounts with significant balances, elevated permissions, or sentimental addresses
:::

## Welcome
Thanks so much for participating in the alpha test of BOS Web Engine, an improved execution layer for NEAR's decentralized front-end components.

## Timeline

The alpha test begins on Feb 26 and runs for several weeks as we perform rigorous testing both internally and with community members such as yourself. 🙏 


## How to get involved 

Check out our [docs](/) to get an idea of how to build on BWE and what is possible.

Next, head to our [sandbox](https://bwe-sandbox.near.dev) and try any of the following:
- Writing components that aren't possible to build using the current VM
- Writing components that test the limits of BWE
- Migrating your existing components from the VM to BWE
- Migrating vanilla React components to BWE

Share what you build with us and the community! We'd love to see what you build and hear about your experience.

## Support from BWE team

The BWE team will be available via Telegram and GitHub Discussions to answer questions and assist in troubleshooting.

[Telegram Group](https://t.me/+IlVl5uEsGH83YTEx)
[GitHub Discussions](https://github.com/near/bos-web-engine/discussions)

## Feedback

We are looking for feedback in the following areas:
- Performance
- Syntax
- Overall developer experience (DevX)
- Documentation
- Level of effort to migrate components to BWE
- Missing capabilities

### Avenues of Feedback

#### Bugs / Performance Issues / Feature Requests

Please create a GitHub issue describing what you are experiencing. The more info the better, but don't let that be a blocker from filing an issue. If you only have time to file something quick, please do so and we can follow up for more details later :slightly_smiling_face: 

#### Opinions on Syntax and DevX

You can [start a GitHub Discussion](https://github.com/near/bos-web-engine/discussions/new?category=misc) or let us know through [this form](example.com)

:::warning
TODO form
:::

## What to expect

BOS Web Engine has reached the point where a majority of the features necessary to build complex and polished applications are in place. It is very close to achieving full parity with the previous VM, and offers significant additional capabilities.

That being said, this is an alpha so rough edges and bugs should be expected. We appreciate your help in identifying these issues so we can quickly move towards a stable release. 🙇

### npm Package Support

A wide variety of npm packages should work out of the box with BWE, especially non-UI packages. See the [npm section of our imports documentation](/docs/building-decentralized-frontends/imports#npm) for full details. You can attempt to import any npm package, but not all will work due to the sandboxed environment.

### Not Supported Yet

- `useRef` (refs not exposed to outer application)
- `useContext`
- `<canvas>` and other Web APIs
- development with local code editor and bos-loader

### Not Planned to be Supported

- Direct DOM manipulation
- interoperability between BWE and the previous VM