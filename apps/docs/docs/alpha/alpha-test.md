---
slug: /
sidebar_position: 1
---

# BWE Alpha Test

## Welcome 🎉

Thank you for participating in the alpha test for BOS Web Engine **(actual release name TBD)**; an improved execution layer for NEAR's decentralized front-end components.

Significant effort has been dedicated to this project, reaching a stage where most of the essential features are established, laying the groundwork for the development of more sophisticated and refined applications. BWE is on the verge of achieving complete parity with the former VM, while also providing substantial additional functionalities.

That being said, this is an **alpha** so rough edges and bugs should be expected. We appreciate your help in identifying these issues so we can quickly move towards a stable release. 🙏

:::danger Warning
Please use **non-vital NEAR accounts** during the alpha test since we have not yet initiated our security audit program. Avoid using accounts with significant balances, elevated permissions, or sentimental addresses.
:::

---

## Timeline

BWE alpha test begins on Feb 26, 2024 and runs for several weeks as we perform rigorous testing both internally and with community members such as yourself. 🙏

---

## How to get involved

    - [Test](#test) 
    - [Ask Questions & Get Support](#support) 
    - [Give Feedback](#give-feedback)

---

### Test

Using the [BWE Sandbox IDE](https://bwe-sandbox.near.dev), try any of the following:

- Write components that aren't possible to build using the current VM
- Write components that test the limits of BWE
- Migrate your existing components from the VM to BWE
- Migrate vanilla React components to BWE

:::tip npm Package Support
A wide variety of npm packages should work out of the box with BWE, especially non-UI packages. See the [npm section of our imports documentation](/docs/building-decentralized-frontends/imports#npm) for full details. 

**Note:** You can attempt to import any npm package, but not all will work due to the sand boxed environment.
:::

:::warning Not Supported Yet

    - `useRef` (refs not exposed to outer application)
    - `useContext`
    - `<canvas>` and other Web APIs
    - development with local code editor and bos-loader

:::

:::info Not Planned to be Supported
    - Direct DOM manipulation
    - Interoperability between BWE and the previous VM
:::

We'd love to see what you build and hear about your experience! Please share what you build with us and the community! 🙏

---

### Support

The BWE team will be available in Telegram and GitHub Discussions to answer any questions you might have and assist in troubleshooting.

- [Telegram Group](https://t.me/+IlVl5uEsGH83YTEx)
- [GitHub Discussions](https://github.com/near/bos-web-engine/discussions)

---

### Give Feedback

There are three main avenues for giving feedback. Please choose whichever is most convenient for you:

    - [BWE Feedback Form](https://forms.gle/5w16G5wix4ezWx4y5) - Easy google feedback form
    - [GitHub Discussions](https://github.com/near/bos-web-engine/discussions/new?category=alpha-test-feedback) - Alpha feedback section of BWE's GH Discussions
    - [GitHub Issues](https://github.com/near/bos-web-engine/issues/new) - Found a bug, performance issue, or have a feature request? [File it here.](https://github.com/near/bos-web-engine/issues) The more info the better, but don't let that be a blocker from filing one! If you only have time to file something quick, please do so and we can follow up for more details later 🙂

:::tip

We are looking for feedback in the following areas:

- Performance
- Syntax
- Documentation
- Level of effort to migrate components to BWE
- Missing capabilities
- Overall developer experience (DevX)
:::



