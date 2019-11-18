

export class WalletCommunicationClientSpec {
  public client = WalletCommunicationClient;
}

import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { WalletCommunicationClient } from '../../src'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
//const expect = chai.expect

describe(`client - Custom Tests`, () => {
  it("will connect to the p2p communication network", async () => {
    const aliceClient = new WalletCommunicationClient("alice1234")
    await aliceClient.start()

    const bobClient = new WalletCommunicationClient("bob1234")
    await bobClient.start()

    const charlieClient = new WalletCommunicationClient("charlie1234")
    await charlieClient.start()

    aliceClient.listenForEncryptedMessage(bobClient.getPublicKey(), (message: string) => {
      console.log("\n\nalice received from bob: " + message)
    })

    aliceClient.listenForEncryptedMessage(charlieClient.getPublicKey(), (message: string) => {
      console.log("\n\nalice received from charlie: " + message)
    })

    bobClient.listenForEncryptedMessage(aliceClient.getPublicKey(), (message: string) => {
      console.log("\n\nbob received from alice: " + message)
    })

    bobClient.listenForEncryptedMessage(charlieClient.getPublicKey(), (message: string) => {
      console.log("\n\nbob received from charlie: " + message)
    })

    charlieClient.listenForEncryptedMessage(aliceClient.getPublicKey(), (message: string) => {
      console.log("\n\ncharlie received from alice: " + message)
    })

    charlieClient.listenForEncryptedMessage(bobClient.getPublicKey(), (message: string) => {
      console.log("\n\ncharlie received from bob: " + message)
    })

    setInterval(() => {
      bobClient.sendMessage(aliceClient.getPublicKey(), "hey from bob\n\n")
      //bobClient.sendMessage(charlieClient.getPublicKey(), 'matrix-dev.papers.tech', "hey from bob")
    }, 5000)

    setInterval(() => {
      aliceClient.sendMessage(bobClient.getPublicKey(), "hey from alice\n\n")
      aliceClient.sendMessage(charlieClient.getPublicKey(), "hey from alice\n\n")
    }, 5000)

    setInterval(() => {
      //charlieClient.sendMessage(bobClient.getPublicKey(), 'matrix.tez.ie', "hey from charlie")
      charlieClient.sendMessage(aliceClient.getPublicKey(), "hey from charlie\n\n")
    }, 5000)

  })
})
