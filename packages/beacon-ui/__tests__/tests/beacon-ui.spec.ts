import { getTzip10Link } from '../../src/utils/get-tzip10-link'

import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe('@airgap/beacon-ui', () => {
  it('should create a tzip 10 URI', () => {
    const link = getTzip10Link('airgap-wallet://', 'PAYLOAD')

    expect(link).to.equal('airgap-wallet://?type=tzip10&data=PAYLOAD')
  })
})
