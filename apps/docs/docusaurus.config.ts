import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'BOS Web Engine Docs',
  tagline: 'Next-gen decentralized frontend execution environment',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://bos-web-engine-docs.vercel.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/', // Serve the docs at the site's root
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.svg',
    navbar: {
      title: 'BOS Web Engine Docs',
      logo: {
        alt: 'NEAR logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo_rev.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'alpha',
          position: 'left',
          label: 'Alpha Test',
        },
        {
          href: 'https://bwe.near.dev',
          label: 'Gateway / Demos',
          position: 'left',
        },
        {
          href: 'https://bwe-sandbox.near.dev',
          label: 'Sandbox',
          position: 'left',
        },
        {
          href: 'https://github.com/near/bos-web-engine',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    // Keeping for reference:
    //
    // footer: {
    //   style: 'dark',
    //   links: [
    // {
    //   title: 'Docs',
    //   items: [
    //     {
    //       label: 'Tutorial',
    //       to: '/docs/intro',
    //     },
    //   ],
    // },
    // {
    //   title: 'Community',
    //   items: [
    //     {
    //       label: 'Stack Overflow',
    //       href: 'https://stackoverflow.com/questions/tagged/docusaurus',
    //     },
    //     {
    //       label: 'Discord',
    //       href: 'https://discordapp.com/invite/docusaurus',
    //     },
    //     {
    //       label: 'Twitter',
    //       href: 'https://twitter.com/docusaurus',
    //     },
    //   ],
    // },
    // {
    //   title: 'More',
    //   items: [
    //     {
    //       label: 'Blog',
    //       to: '/blog',
    //     },
    //     {
    //       label: 'GitHub',
    //       href: 'https://github.com/facebook/docusaurus',
    //     },
    //   ],
    // },
    // ],
    // copyright: `Copyright © ${new Date().getFullYear()} Pagoda`,
    // },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
