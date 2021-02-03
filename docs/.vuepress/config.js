// Automatically generate the sidebar
// const getConfig = require('vuepress-bar')
// const barConfig = getConfig(`${__dirname}/..`)

// console.log('barConfig.sidebar', barConfig.sidebar)

// We need to change the order, so we take the generated output from above and customize it
const sidebar = [
  '',
  {
    title: 'Beacon',
    children: [
      'beacon/02.getting-started-dapp',
      'beacon/03.getting-started-wallet',
      'beacon/04.getting-started-extension',
      'beacon/05.messages',
      'beacon/06.errors',
      'beacon/07.contracts',
      'beacon/08.security',
      'beacon/09.faq',
      'beacon/10.security-audits'
    ]
  },
  {
    title: 'Examples',
    children: [
      'examples/02.permission-request',
      'examples/03.operation-request',
      'examples/04.sign-request',
      'examples/05.broadcast-request',
      'examples/06.using-custom-network',
      'examples/07-overriding-default-events',
      'examples/08-standalone-delegation'
    ]
  },
  {
    title: 'Flows',
    children: [
      'flows/Connection',
      'flows/ExtensionCommunication',
      'flows/Ledger',
      'flows/LocalMnemonic',
      'flows/P2PDirect',
      'flows/P2PExtension'
    ]
  },
  'CHANGELOG',
  'supported-wallets'
]

module.exports = {
  base: '/',
  title: 'Beacon SDK Documentation',
  description: 'Connecting dApps on Tezos with your wallet.',
  themeConfig: {
    repo: 'airgap-it/beacon-sdk',
    nav: [
      { text: 'Example dApp', link: 'https://www.walletbeacon.io/', target: '_blank' },
      {
        text: 'Chrome Extension',
        link: 'https://chrome.google.com/webstore/detail/gpfndedineagiepkpinficbcbbgjoenn/',
        target: '_blank'
      }
    ],
    sidebar: sidebar
  },
  plugins: [
    '@vuepress/last-updated',
    '@vuepress/plugin-back-to-top',
    '@vuepress/nprogress',
    'vuepress-plugin-mermaidjs',
    ['vuepress-plugin-code-copy', true]
  ],
  evergreen: true
}
