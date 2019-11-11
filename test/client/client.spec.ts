

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
    const aliceClient = new WalletCommunicationClient("alice4")
    await aliceClient.start()


    const bobClient = new WalletCommunicationClient("bob4")
    await bobClient.start()
    aliceClient.listenForEncryptedMessage(bobClient.getPublicKey(), (message: string) => {
      console.log("received: " + message)
    })

    setTimeout(() => {
      bobClient.sendMessage(aliceClient.getPublicKey(), "hey")
    }, 1000)

  })
})
