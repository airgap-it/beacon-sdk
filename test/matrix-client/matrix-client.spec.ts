import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { LocalStorage } from '../../src'
import { MatrixClient } from '../../src/matrix-client/MatrixClient'
// import sinon from 'sinon'

MatrixClient
// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`MatrixClient`, () => {
  let client: MatrixClient
  beforeEach(() => {
    client = MatrixClient.create({
      baseUrl: `https://test.walletbeacon.io`,
      storage: new LocalStorage()
    })
  })

  it(`should create with options`, async () => {
    expect(client).to.not.be.undefined
  })

  it(`should return joined rooms`, async () => {
    expect(client.joinedRooms).to.deep.equal([])
  })

  it.skip(`should return invited rooms`, async () => {
    expect(client.invitedRooms).to.deep.equal([])
  })

  it.skip(`should return left rooms`, async () => {
    expect(client.leftRooms).to.deep.equal([])
  })

  it.skip(`should start`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should subscribe`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should get a room by id`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should create a trusted private room`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should invite a user to a room`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should join rooms`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should send a text message`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should poll the server for updates`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should send a sync request to the server`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should check if an access token is present`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should create a transaction id`, async () => {
    expect(true).to.be.false
  })
})
