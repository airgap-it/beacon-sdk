export class WalletCommunicationClientSpec {
  public client = WalletCommunicationClient
}

const MAX_TEST_RUNTIME_SECONDS = 10

import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { generateGUID } from '../../src/utils/generate-uuid'
import { WalletCommunicationClient } from '../../src'
import { getKeypairFromSeed } from '../../src/utils/crypto'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
//const expect = chai.expect

describe(`client - Custom Tests`, () => {
  it('will connect to the p2p communication network', async () => {
    return new Promise(async (resolve) => {
      const intervals: NodeJS.Timeout[] = []

      const aliceClient = new WalletCommunicationClient(
        'Alice',
        await getKeypairFromSeed('alice1234'),
        1
      )
      await aliceClient
        .start()
        .catch((aliceClientError) => console.log('aliceClientError', aliceClientError))

      const bobClient = new WalletCommunicationClient('Bob', await getKeypairFromSeed('bob1234'), 1)
      await bobClient
        .start()
        .catch((bobClientError) => console.log('bobClientError', bobClientError))

      const charlieClient = new WalletCommunicationClient(
        'Charlie',
        await getKeypairFromSeed('charlie1234'),
        1
      )
      await charlieClient
        .start()
        .catch((charlieClientError) => console.log('charlieClientError', charlieClientError))

      aliceClient.listenForEncryptedMessage(bobClient.getPublicKey(), (message: string) => {
        console.log('\n\nalice received from bob: ' + message)
      })

      aliceClient.listenForEncryptedMessage(charlieClient.getPublicKey(), (message: string) => {
        console.log('\n\nalice received from charlie: ' + message)
      })

      bobClient.listenForEncryptedMessage(aliceClient.getPublicKey(), (message: string) => {
        console.log('\n\nbob received from alice: ' + message)
      })

      bobClient.listenForEncryptedMessage(charlieClient.getPublicKey(), (message: string) => {
        console.log('\n\nbob received from charlie: ' + message)
      })

      charlieClient.listenForEncryptedMessage(aliceClient.getPublicKey(), (message: string) => {
        console.log('\n\ncharlie received from alice: ' + message)
      })

      charlieClient.listenForEncryptedMessage(bobClient.getPublicKey(), (message: string) => {
        console.log('\n\ncharlie received from bob: ' + message)
      })

      intervals.push(
        setInterval(() => {
          bobClient.sendMessage(aliceClient.getPublicKey(), `hey from bob ${generateGUID()}\n\n`)
          //bobClient.sendMessage(charlieClient.getPublicKey(), 'matrix-dev.papers.tech', "hey from bob")
        }, 5000)
      )

      intervals.push(
        setInterval(() => {
          aliceClient.sendMessage(bobClient.getPublicKey(), `hey from alice ${generateGUID()}\n\n`)
          aliceClient.sendMessage(
            charlieClient.getPublicKey(),
            `hey from alice ${generateGUID()}\n\n`
          )
        }, 5000)
      )

      intervals.push(
        setInterval(() => {
          //charlieClient.sendMessage(bobClient.getPublicKey(), 'matrix.tez.ie', "hey from charlie")
          charlieClient.sendMessage(
            aliceClient.getPublicKey(),
            `hey from charlie ${generateGUID()}\n\n`
          )
        }, 5000)
      )

      setTimeout(() => {
        intervals.forEach((intervalId) => {
          console.log('clearing interval', intervalId)
          clearInterval(intervalId)
        })
        resolve()

        setTimeout(() => {
          process.exit(0)
        }, MAX_TEST_RUNTIME_SECONDS * 1000)
      }, MAX_TEST_RUNTIME_SECONDS * 1000)
    })
  })
})
