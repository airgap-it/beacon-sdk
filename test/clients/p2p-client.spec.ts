import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { generateGUID } from '../../src/utils/generate-uuid'
import { P2PCommunicationClient, LocalStorage } from '../../src'
import { getKeypairFromSeed } from '../../src/utils/crypto'
import { expect } from 'chai'

const MAX_TEST_RUNTIME_SECONDS = 10

// use chai-as-promised plugin
chai.use(chaiAsPromised)
//const expect = chai.expect

const debug = true

describe.only(`client - Custom Tests`, () => {
  after(() => {
    global.setTimeout(() => {
      console.log('ABORTING PROCESS')
      process.exit(0)
    }, MAX_TEST_RUNTIME_SECONDS * 1000)
  })

  // it('will connect to the p2p communication network', async () => {
  //   const randomIDsUsed: string[] = []
  //   const messagesReceived: string[] = []

  //   const getNextRandomId = async () => {
  //     const id = await generateGUID()
  //     randomIDsUsed.push(id)

  //     return id
  //   }

  //   return new Promise(async (resolve) => {
  //     const intervals: NodeJS.Timeout[] = []

  //     const aliceClient = new P2PCommunicationClient(
  //       'Alice',
  //       await getKeypairFromSeed('alice1234'),
  //       1,
  //       new LocalStorage('alice1234'),
  //       ['matrix.papers.tech'],
  //       debug
  //     )
  //     await aliceClient
  //       .start()
  //       .catch((aliceClientError) => console.log('aliceClientError', aliceClientError))

  //     const bobClient = new P2PCommunicationClient(
  //       'Bob',
  //       await getKeypairFromSeed('bob1234'),
  //       1,
  //       new LocalStorage('bob1234'),
  //       ['matrix-dev.papers.tech'],
  //       debug
  //     )
  //     await bobClient
  //       .start()
  //       .catch((bobClientError) => console.log('bobClientError', bobClientError))

  //     const charlieClient = new P2PCommunicationClient(
  //       'Charlie',
  //       await getKeypairFromSeed('charlie1234'),
  //       1,
  //       new LocalStorage('charlie1234'),
  //       ['matrix-dev.papers.tech'],
  //       debug
  //     )
  //     await charlieClient
  //       .start()
  //       .catch((charlieClientError) => console.log('charlieClientError', charlieClientError))

  //     aliceClient.listenForEncryptedMessage(await bobClient.getPublicKey(), (message: string) => {
  //       const logMessage = `alice received from bob: "${message}"`
  //       messagesReceived.push(logMessage)
  //       console.log(`\n${logMessage}`)
  //     })

  //     aliceClient.listenForEncryptedMessage(
  //       await charlieClient.getPublicKey(),
  //       (message: string) => {
  //         const logMessage = `alice received from charlie: "${message}"`
  //         messagesReceived.push(logMessage)
  //         console.log(`\n${logMessage}`)
  //       }
  //     )

  //     bobClient.listenForEncryptedMessage(await aliceClient.getPublicKey(), (message: string) => {
  //       const logMessage = `bob received from alice: "${message}"`
  //       messagesReceived.push(logMessage)
  //       console.log(`\n${logMessage}`)
  //     })

  //     bobClient.listenForEncryptedMessage(await charlieClient.getPublicKey(), (message: string) => {
  //       const logMessage = `bob received from charlie: "${message}"`
  //       messagesReceived.push(logMessage)
  //       console.log(`\n${logMessage}`)
  //     })

  //     charlieClient.listenForEncryptedMessage(
  //       await aliceClient.getPublicKey(),
  //       (message: string) => {
  //         const logMessage = `charlie received from alice: "${message}"`
  //         messagesReceived.push(logMessage)
  //         console.log(`\n${logMessage}`)
  //       }
  //     )

  //     charlieClient.listenForEncryptedMessage(await bobClient.getPublicKey(), (message: string) => {
  //       const logMessage = `charlie received from bob: "${message}"`
  //       messagesReceived.push(logMessage)
  //       console.log(`\n${logMessage}`)
  //     })

  //     intervals.push(
  //       global.setInterval(async () => {
  //         bobClient.sendMessage(
  //           await aliceClient.getPublicKey(),
  //           `hey from bob ${await getNextRandomId()}`
  //         )
  //         //bobClient.sendMessage(charlieClient.getPublicKey(), 'matrix-dev.papers.tech', "hey from bob")
  //       }, 5000)
  //     )

  //     intervals.push(
  //       global.setInterval(async () => {
  //         aliceClient.sendMessage(
  //           await bobClient.getPublicKey(),
  //           `hey from alice ${await getNextRandomId()}`
  //         )
  //         aliceClient.sendMessage(
  //           await charlieClient.getPublicKey(),
  //           `hey from alice ${await getNextRandomId()}`
  //         )
  //       }, 5000)
  //     )

  //     intervals.push(
  //       global.setInterval(async () => {
  //         // charlieClient.sendMessage(bobClient.getPublicKey(), 'matrix.tez.ie', 'hey from charlie')
  //         charlieClient.sendMessage(
  //           await aliceClient.getPublicKey(),
  //           `hey from charlie ${await getNextRandomId()}`
  //         )
  //       }, 5000)
  //     )

  //     global.setTimeout(() => {
  //       intervals.forEach((intervalId) => {
  //         clearInterval(intervalId)
  //       })

  //       console.log('randomIDs', randomIDsUsed)

  //       expect(messagesReceived.length, 'received all messages we send').to.equal(
  //         randomIDsUsed.length
  //       )
  //       const receivedEveryMessageOnce = randomIDsUsed.every((id) => {
  //         return messagesReceived.filter((message) => message.includes(id)).length === 1
  //       })

  //       expect(receivedEveryMessageOnce, 'received exact number of messages').to.be.true

  //       resolve()
  //     }, MAX_TEST_RUNTIME_SECONDS * 1000)
  //   })
  // })

  it('will send messages to users logged in on other servers', async () => {
    const randomIDsUsed: string[] = []
    const messagesReceived: string[] = []

    const getNextRandomId = async () => {
      const id = await generateGUID()
      randomIDsUsed.push(id)

      return id
    }

    return new Promise(async (resolve) => {
      const intervals: NodeJS.Timeout[] = []

      const aliceClient = new P2PCommunicationClient(
        'Alice',
        await getKeypairFromSeed('alice1234'),
        1,
        new LocalStorage('alice1234'),
        ['matrix.papers.tech'],
        debug
      )
      await aliceClient
        .start()
        .catch((aliceClientError) => console.log('aliceClientError', aliceClientError))

      const bobClient = new P2PCommunicationClient(
        'Bob',
        await getKeypairFromSeed('bob1234'),
        1,
        new LocalStorage('bob1234'),
        ['matrix-dev.papers.tech'],
        debug
      )
      await bobClient
        .start()
        .catch((bobClientError) => console.log('bobClientError', bobClientError))

      aliceClient.listenForEncryptedMessage(await bobClient.getPublicKey(), (message: string) => {
        const logMessage = `alice received from bob: "${message}"`
        messagesReceived.push(logMessage)
        console.log(`\n${logMessage}`)
      })

      bobClient.listenForEncryptedMessage(await aliceClient.getPublicKey(), (message: string) => {
        const logMessage = `bob received from alice: "${message}"`
        messagesReceived.push(logMessage)
        console.log(`\n${logMessage}`)
      })

      intervals.push(
        global.setInterval(async () => {
          bobClient.sendMessage(
            await aliceClient.getPublicKey(),
            `hey from bob ${await getNextRandomId()}`
          )
          //bobClient.sendMessage(charlieClient.getPublicKey(), 'matrix-dev.papers.tech', "hey from bob")
        }, 5000)
      )

      intervals.push(
        global.setInterval(async () => {
          aliceClient.sendMessage(
            await bobClient.getPublicKey(),
            `hey from alice ${await getNextRandomId()}`
          )
          // aliceClient.sendMessage(
          //   await charlieClient.getPublicKey(),
          //   `hey from alice ${await getNextRandomId()}`
          // )
        }, 5000)
      )

      global.setTimeout(() => {
        intervals.forEach((intervalId) => {
          clearInterval(intervalId)
        })

        console.log('randomIDs', randomIDsUsed)

        expect(messagesReceived.length, 'received all messages we send').to.equal(
          randomIDsUsed.length
        )
        const receivedEveryMessageOnce = randomIDsUsed.every((id) => {
          return messagesReceived.filter((message) => message.includes(id)).length === 1
        })

        expect(receivedEveryMessageOnce, 'received exact number of messages').to.be.true

        resolve()
      }, MAX_TEST_RUNTIME_SECONDS * 1000)
    })
  })

  it('should have the same rooms', async () => {
    const aliceClient1 = new P2PCommunicationClient(
      'Alice1',
      await getKeypairFromSeed('alice1234'),
      1,
      new LocalStorage('alice1234-1'),
      ['matrix.papers.tech'],
      debug
    )

    const aliceClient2 = new P2PCommunicationClient(
      'Alice2',
      await getKeypairFromSeed('alice1234'),
      1,
      new LocalStorage('alice1234-2'),
      ['matrix-dev.papers.tech'],
      debug
    )

    await aliceClient1
      .start()
      .catch((aliceClientError) => console.log('aliceClientError', aliceClientError))
    await aliceClient2
      .start()
      .catch((aliceClientError) => console.log('aliceClient2Error', aliceClientError))

    await aliceClient1.sendMessage(await aliceClient2.getPublicKey(), 'test from alice 1')
    await aliceClient2.sendMessage(await aliceClient1.getPublicKey(), 'test from alice 2')

    console.log(await generateGUID())
    expect(true).to.be.true
  })
})
