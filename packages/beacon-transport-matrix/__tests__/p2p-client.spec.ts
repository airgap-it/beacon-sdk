import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import { P2PCommunicationClient } from '../src'
import {
  deterministicShuffle,
  publicKeyToNumber
} from '../src/communication-client/P2PCommunicationClient'
import { getKeypairFromSeed, generateGUID } from '@airgap/beacon-utils'
import { LocalStorage } from '@airgap/beacon-core'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const SEED = 'test'

describe.only(`P2PCommunicationClient`, () => {
  let client: P2PCommunicationClient

  beforeEach(async () => {
    sinon.restore()

    const keypair = await getKeypairFromSeed(SEED)
    const localStorage = new LocalStorage()

    client = new P2PCommunicationClient('Test', keypair, 2, localStorage, [])
  })

  it(`should have more than 1 node available`, async () => {
    expect((client as any).ENABLED_RELAY_SERVERS.length > 1).to.be.true
  })

  it(`should return a random number from public key`, async () => {
    const numberOfIterations = 1000
    for (let maxNumber of [1, 2, 3, 4, 5, 10, 20]) {
      const results: Record<number, number> = {}
      for (let x = 0; x < numberOfIterations; x++) {
        const seed = await getKeypairFromSeed(await generateGUID())
        const result = publicKeyToNumber(seed.publicKey, maxNumber)
        const temp = results[result] ?? 0
        results[result] = temp + 1
      }

      const margin = 0.05 * maxNumber
      const expectedAmount = Math.floor(numberOfIterations / maxNumber)

      const upperLimit = expectedAmount * (1 + margin)
      const lowerLimit = expectedAmount * (1 - margin)

      for (let el of Object.values(results)) {
        expect(el).to.be.lessThan(upperLimit)
        expect(el).to.be.greaterThan(lowerLimit)
      }

      // TODO: Why does this fail?
      // Object.values(results).forEach((el: number) => {
      //   isValid = isValid && el < upperLimit
      //   isValid = isValid && el > lowerLimit
      //   expect(el).to.be.greaterThan(2)
      //   expect(el).to.be.lessThan(2)
      // })
    }
  })

  it(`should deterministicalls shuffle an array`, async () => {
    const keypair1 = await getKeypairFromSeed('test')
    const keypair2 = await getKeypairFromSeed('test1')
    const arr1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

    const shuffled1A = deterministicShuffle(arr1, keypair1)
    // console.log('shuffled1A', shuffled1A)
    expect(shuffled1A).to.deep.equal(['7', '2', '6', '3', '9', '4', '1', '8', '5', '10'])
    const shuffled1B = deterministicShuffle(arr1, keypair2)
    // console.log('shuffled1B', shuffled1B)
    expect(shuffled1B).to.deep.equal(['9', '6', '3', '5', '4', '8', '7', '10', '1', '2'])

    const arr2 = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    const shuffled2A = deterministicShuffle(arr2, keypair1)
    // console.log('shuffled2A', shuffled2A)
    expect(shuffled2A).to.deep.equal(['2', '6', '3', '8', '4', '1', '7', '5', '9'])
    const shuffled2B = deterministicShuffle(arr2, keypair2)
    // console.log('shuffled2B', shuffled2B)
    expect(shuffled2B).to.deep.equal(['6', '3', '5', '4', '8', '7', '9', '1', '2'])
  })

  it(`should randomize node array`, async () => {
    const testCases = [
      {
        seed: 'test',
        order: [
          'beacon-node-0.papers.tech:8448',
          'beacon-node-1.sky.papers.tech',
          'beacon-node-2.sky.papers.tech'
        ]
      },
      {
        seed: 'test1',
        order: [
          'beacon-node-2.sky.papers.tech',
          'beacon-node-1.sky.papers.tech',
          'beacon-node-0.papers.tech:8448'
        ]
      },
      {
        seed: 'test2',
        order: [
          'beacon-node-1.sky.papers.tech',
          'beacon-node-2.sky.papers.tech',
          'beacon-node-0.papers.tech:8448'
        ]
      },
      {
        seed: 'test3',
        order: [
          'beacon-node-1.sky.papers.tech',
          'beacon-node-2.sky.papers.tech',
          'beacon-node-0.papers.tech:8448'
        ]
      }
    ]
    for (let testCase of testCases) {
      const keypair = await getKeypairFromSeed(testCase.seed)
      const localStorage = new LocalStorage()

      const c = new P2PCommunicationClient('Test', keypair, 2, localStorage, [])
      expect((c as any).ENABLED_RELAY_SERVERS, `seed: ${testCase.seed}`).to.deep.equal(
        testCase.order
      )
    }
  })
})
