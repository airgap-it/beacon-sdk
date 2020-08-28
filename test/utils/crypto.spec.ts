import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { getAddressFromPublicKey } from '../../src/utils/crypto'
import { generateGUID } from '../../src/utils/generate-uuid'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`Crypto`, () => {
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
        await getAddressFromPublicKey('test')
        throw new Error('this should fail!')
      } catch (error) {
        expect(error.message).to.deep.equal('invalid publicKey: test')
      }
    })
  })

  describe('generateGUID', () => {
    it(`should create a GUID`, async () => {
      const GUID = await generateGUID()

      expect(typeof GUID).to.deep.equal('string')
    })
  })
})
