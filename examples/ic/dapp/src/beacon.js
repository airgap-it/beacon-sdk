import { getDAppClientInstance, ICBlockchain, Regions } from '@airgap/beacon-sdk'

export function createDAppClient() {
  const client = getDAppClientInstance({
    name: 'Example DApp', // Name of the DApp,
    disclaimerText: 'This is an optional <b>disclaimer</b>.',
    appUrl: 'http://localhost:3000',
    matrixNodes: {
      [Regions.EUROPE_WEST]: [
      'beacon-node-1.diamond.papers.tech',
      'beacon-node-1.sky.papers.tech',
      'beacon-node-2.sky.papers.tech',
      'beacon-node-1.hope.papers.tech',
      'beacon-node-1.hope-2.papers.tech',
      'beacon-node-1.hope-3.papers.tech',
      'beacon-node-1.hope-4.papers.tech',
      'beacon-node-1.hope-5.papers.tech'
      ],
      [Regions.NORTH_AMERICA_EAST]: []
    }
  })

  const icBlockchain = new ICBlockchain()
  client.addBlockchain(icBlockchain)

  return client
}

export function publicKeyFromAccount(account) {
  return Buffer.from(account.chainData.identities[0].publicKey, 'base64')
}