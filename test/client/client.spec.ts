import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { generateGUID } from '../../src/utils/generate-uuid'
import { P2PCommunicationClient } from '../../src'
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
        1
      )
      await aliceClient
        .start()
        .catch((aliceClientError) => console.log('aliceClientError', aliceClientError))

      const bobClient = new P2PCommunicationClient('Bob', await getKeypairFromSeed('bob1234'), 1)
      await bobClient
        .start()
        .catch((bobClientError) => console.log('bobClientError', bobClientError))

      const charlieClient = new P2PCommunicationClient(
        'Charlie',
        await getKeypairFromSeed('charlie1234'),
        1
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
        setInterval(async () => {
          bobClient.sendMessage(
            await aliceClient.getPublicKey(),
            `hey from bob ${generateGUID()}\n\n`
          )
          //bobClient.sendMessage(charlieClient.getPublicKey(), 'matrix-dev.papers.tech', "hey from bob")
        }, 5000)
      )

      intervals.push(
        setInterval(async () => {
          aliceClient.sendMessage(
            await bobClient.getPublicKey(),
            `hey from alice ${generateGUID()}\n\n`
          )
          aliceClient.sendMessage(
            await charlieClient.getPublicKey(),
            `hey from alice ${generateGUID()}\n\n`
          )
        }, 5000)
      )

      intervals.push(
        setInterval(async () => {
          //charlieClient.sendMessage(bobClient.getPublicKey(), 'matrix.tez.ie', "hey from charlie")
          charlieClient.sendMessage(
            await aliceClient.getPublicKey(),
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
