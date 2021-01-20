import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { generateGUID } from '../../src/utils/generate-uuid'
import { P2PCommunicationClient, LocalStorage } from '../../src'
import { getKeypairFromSeed } from '../../src/utils/crypto'

const MAX_TEST_RUNTIME_SECONDS = 10

// use chai-as-promised plugin
chai.use(chaiAsPromised)
//const expect = chai.expect

describe.skip(`client - Custom Tests`, () => {
  it('will connect to the p2p communication network', async () => {
    return new Promise(async (resolve) => {
      const intervals: NodeJS.Timeout[] = []

      const aliceClient = new P2PCommunicationClient(
        'Alice',
        await getKeypairFromSeed('alice1234'),
        1,
        new LocalStorage(),
        []
      )
      await aliceClient
        .start()
        .catch((aliceClientError) => console.log('aliceClientError', aliceClientError))

      const bobClient = new P2PCommunicationClient(
        'Bob',
        await getKeypairFromSeed('bob1234'),
        1,
        new LocalStorage(),
        []
      )
      await bobClient
        .start()
        .catch((bobClientError) => console.log('bobClientError', bobClientError))

      const charlieClient = new P2PCommunicationClient(
        'Charlie',
        await getKeypairFromSeed('charlie1234'),
        1,
        new LocalStorage(),
        []
      )
      await charlieClient
        .start()
        .catch((charlieClientError) => console.log('charlieClientError', charlieClientError))

      aliceClient.listenForEncryptedMessage(await bobClient.getPublicKey(), (message: string) => {
        console.log('\n\nalice received from bob: "' + message + '"')
      })

      aliceClient.listenForEncryptedMessage(
        await charlieClient.getPublicKey(),
        (message: string) => {
          console.log('\n\nalice received from charlie: "' + message + '"')
        }
      )

      bobClient.listenForEncryptedMessage(await aliceClient.getPublicKey(), (message: string) => {
        console.log('\n\nbob received from alice: "' + message + '"')
      })

      bobClient.listenForEncryptedMessage(await charlieClient.getPublicKey(), (message: string) => {
        console.log('\n\nbob received from charlie: "' + message + '"')
      })

      charlieClient.listenForEncryptedMessage(
        await aliceClient.getPublicKey(),
        (message: string) => {
          console.log('\n\ncharlie received from alice: "' + message + '"')
        }
      )

      charlieClient.listenForEncryptedMessage(await bobClient.getPublicKey(), (message: string) => {
        console.log('\n\ncharlie received from bob: "' + message + '"')
      })

      intervals.push(
        global.setInterval(async () => {
          bobClient.sendMessage(
            `hey from bob ${await generateGUID()}\n\n`,
            await aliceClient.getPairingRequestInfo()
          )
          //bobClient.sendMessage(charlieClient.getPublicKey(), 'matrix-dev.papers.tech', "hey from bob")
        }, 5000)
      )

      intervals.push(
        global.setInterval(async () => {
          aliceClient.sendMessage(
            `hey from alice ${await generateGUID()}\n\n`,
            await bobClient.getPairingRequestInfo()
          )
          aliceClient.sendMessage(
            `hey from alice ${await generateGUID()}\n\n`,
            await charlieClient.getPairingRequestInfo()
          )
        }, 5000)
      )

      intervals.push(
        global.setInterval(async () => {
          //charlieClient.sendMessage(bobClient.getPublicKey(), 'matrix.tez.ie', "hey from charlie")
          charlieClient.sendMessage(
            `hey from charlie ${await generateGUID()}\n\n`,
            await aliceClient.getPairingRequestInfo()
          )
        }, 5000)
      )

      global.setTimeout(() => {
        intervals.forEach((intervalId) => {
          console.log('clearing interval', intervalId)
          clearInterval(intervalId)
        })
        resolve()

        global.setTimeout(() => {
          process.exit(0)
        }, MAX_TEST_RUNTIME_SECONDS * 1000)
      }, MAX_TEST_RUNTIME_SECONDS * 1000)
    })
  })
})
