import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import { getDAppClientInstance } from '../../src/utils/get-instance'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`getDAppClientInstance`, () => {
  beforeEach(async () => {
    sinon.restore()
  })

  it(`should get an instance`, async () => {
    const instance = getDAppClientInstance({ name: 'test' })

    expect(instance).to.not.be.undefined
  })

  it(`should get the same instance`, async () => {
    const instance1 = getDAppClientInstance({ name: 'test' })
    const instance2 = getDAppClientInstance({ name: 'test' })

    expect(instance1).to.equal(instance2)
  })

  it(`should get the same instance with different config`, async () => {
    const instance1 = getDAppClientInstance({ name: 'test' })
    const instance2 = getDAppClientInstance({ name: 'test1' })

    expect(instance1).to.equal(instance2)
  })

  it(`should get a different instance if reset is set`, async () => {
    const instance1 = getDAppClientInstance({ name: 'test' })
    const instance2 = getDAppClientInstance({ name: 'test1' }, true)

    expect(instance1).to.not.equal(instance2)
  })
})
