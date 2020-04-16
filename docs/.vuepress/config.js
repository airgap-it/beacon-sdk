const getConfig = require('vuepress-bar')
const barConfig = getConfig(`${__dirname}/..`)

module.exports = {
  base: '/beacon-sdk/',
  title: 'Beacon SDK Documentation',
  description: 'Connecting dApps on Tezos with your wallet.',
  themeConfig: {
    repo: 'airgap-it/beacon-sdk',
    nav: [{ text: 'Example dApp', link: 'https://www.walletbeacon.io/', target: '_blank' }],
    sidebar: barConfig.sidebar
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
