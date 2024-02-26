# BWE Alpha Test

## Welcome!

Thank you for participating in the alpha test for BOS Web Engine **(actual release name TBD)**; an improved execution layer for NEAR's decentralized front-end components. 

Significant effort has been dedicated to this project, reaching a stage where most of the essential features are established, laying the groundwork for the development of more sophisticated and refined applications. BWE is on the verge of achieving complete parity with the former VM, while also providing substantial additional functionalities.

That being said, this is an **alpha** so rough edges and bugs should be expected. We appreciate your help in identifying these issues so we can quickly move towards a stable release. 🙏

:::danger Warning
Please use **non-vital NEAR accounts** during the alpha test since we have not yet initiated our security audit program. Avoid using accounts with significant balances, elevated permissions, or sentimental addresses.
:::

---

## Timeline

The alpha test begins on Feb 26, 2024 and runs for several weeks as we perform rigorous testing both internally and with community members such as yourself. 🙏 

---

## How to get involved 

1) Test 
2) Ask Questions
3) Give Feedback

### Test

Using the [BWE Sandbox IDE](https://bwe-sandbox.near.dev), try any of the following:

- Writing components that aren't possible to build using the current VM
- Writing components that test the limits of BWE
- Migrating your existing components from the VM to BWE
- Migrating vanilla React components to BWE

:::info npm Package Support

A wide variety of npm packages should work out of the box with BWE, especially non-UI packages. See the [npm section of our imports   documentation](/docs/building-decentralized-frontends/imports#npm) for full details. You can attempt to import any npm package, but not all will work due to the sandboxed environment.


:::danger Not Supported Yet

 - `useRef` (refs not exposed to outer application)
 - `useContext`
 - `<canvas>` and other Web APIs
 - development with local code editor and bos-loader

 :::

:::tip Not Planned to be Supported

- Direct DOM manipulation
- Interoperability between BWE and the previous VM

:::


## Resources


- [BWE Docs](https://bwe-docs.near.dev) _(Also located in the sidebar of the online editor)_
- [Gateway Example](https://bwe.near.dev)


Share what you build with us and the community! We'd love to see what you build and hear about your experience.

## Support from BWE team

The BWE team will be available via Telegram and GitHub Discussions to answer questions and assist in troubleshooting.

- [Telegram Group](https://t.me/+IlVl5uEsGH83YTEx)
- [GitHub Discussions](https://github.com/near/bos-web-engine/discussions)

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

You can [Start a GitHub Discussion](https://github.com/near/bos-web-engine/discussions/new?category=misc) or let us know through this form

- [BOS Web Engine Feeback For ](https://forms.gle/5w16G5wix4ezWx4y5)