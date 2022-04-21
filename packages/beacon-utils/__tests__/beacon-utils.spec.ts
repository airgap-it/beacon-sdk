'use strict'

import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { getAddressFromPublicKey } from '../src/utils/crypto'
import { generateGUID } from '../src/utils/generate-uuid'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`Crypto`, () => {
  describe(`tz1`, () => {
    describe('getAddressFromPublicKey', () => {
      it(`should convert plain public key to address`, async () => {
        const address: string = await getAddressFromPublicKey(
          '444e1f4ab90c304a5ac003d367747aab63815f583ff2330ce159d12c1ecceba1'
        )

        expect(address).to.deep.equal('tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7')
      })

      it(`should edpk public key to address`, async () => {
        const address: string = await getAddressFromPublicKey(
          'edpkuxyLpwfawtWCazyBJQwpWtD9Ehs1KpnHzyNLyvtdPSf16DKA8A'
        )

        expect(address).to.deep.equal('tz1ZgmtH7SbhWmrSk6cpywkwh2uhncn9YgeA')
      })

      it(`should throw an error if an invalid public key is used`, async () => {
        try {
          await getAddressFromPublicKey('edpkuxyLpwfawtWCazyBJQwpWtD9Ehs1KpnHzyNLyvtdPSf16DKA8Ax')
          throw new Error('this should fail!')
        } catch (error) {
          expect((error as any).message).to.deep.equal(
            'invalid publicKey: edpkuxyLpwfawtWCazyBJQwpWtD9Ehs1KpnHzyNLyvtdPSf16DKA8Ax'
          )
        }
      })
    })
  })

  describe(`tz2`, () => {
    describe('getAddressFromPublicKey', () => {
      it(`should sppk public key to address`, async () => {
        const address: string = await getAddressFromPublicKey(
          'sppk7bWyHyv5QStTzJmFkeH5Caf6WKoDHDx64AxEtpBwwxgZu6vpmjU'
        )

        expect(address).to.deep.equal('tz28KhxeXtHFqhMwrb1KUfmRS6j9vCu1ZKNH')
      })

      it(`should throw an error if an invalid public key is used`, async () => {
        try {
          await getAddressFromPublicKey('sppk7bWyHyv5QStTzJmFkeH5Caf6WKoDHDx64AxEtpBwwxgZu6vpmjUx')
          throw new Error('this should fail!')
        } catch (error) {
          expect((error as any).message).to.deep.equal(
            'invalid publicKey: sppk7bWyHyv5QStTzJmFkeH5Caf6WKoDHDx64AxEtpBwwxgZu6vpmjUx'
          )
        }
      })
    })
  })

  describe(`tz3`, () => {
    describe('getAddressFromPublicKey', () => {
      it(`should p2pk public key to address`, async () => {
        const address: string = await getAddressFromPublicKey(
          'p2pk67wVncLFS1DQDm2gVR45sYCzQSXTtqn3bviNYXVCq6WRoqtxHXL'
        )

        expect(address).to.deep.equal('tz3RDC3Jdn4j15J7bBHZd29EUee9gVB1CxD9')
      })

      it(`should throw an error if an invalid public key is used`, async () => {
        try {
          await getAddressFromPublicKey('p2pk67wVncLFS1DQDm2gVR45sYCzQSXTtqn3bviNYXVCq6WRoqtxHXLx')
          throw new Error('this should fail!')
        } catch (error) {
          expect((error as any).message).to.deep.equal(
            'invalid publicKey: p2pk67wVncLFS1DQDm2gVR45sYCzQSXTtqn3bviNYXVCq6WRoqtxHXLx'
          )
        }
      })
    })
  })

  it(`should throw an error if an invalid public key is used`, async () => {
    try {
      await getAddressFromPublicKey('test')
      throw new Error('this should fail!')
    } catch (error) {
      expect((error as any).message).to.deep.equal('invalid publicKey: test')
    }
  })

  describe('generateGUID', () => {
    it(`should create a GUID`, async () => {
      const GUID = await generateGUID()

      expect(typeof GUID).to.deep.equal('string')
    })
  })
})
