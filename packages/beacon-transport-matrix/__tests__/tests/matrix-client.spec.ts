import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { LocalStorage } from '@mavrykdynamics/beacon-core'
import { MatrixClient } from '../../src/matrix-client/MatrixClient'
import * as sinon from 'sinon'
import { MatrixRoomStatus } from '../../src/matrix-client/models/MatrixRoom'
import { MatrixHttpClient } from '../../src/matrix-client/MatrixHttpClient'
import { MatrixClientEventType } from '../../src/matrix-client/models/MatrixClientEvent'

MatrixClient
// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`MatrixClient`, () => {
  let client: MatrixClient
  beforeEach(() => {
    sinon.restore()
    client = MatrixClient.create({
      baseUrl: `https://test.walletbeacon.io`,
      storage: new LocalStorage()
    })
    ;(client as any)._isReady.resolve()
  })

  it(`should create with options`, async () => {
    expect(client).to.not.be.undefined
  })

  it(`should return joined rooms (case: empty)`, async () => {
    expect(await client.joinedRooms).to.deep.equal([])
  })

  it(`should return joined rooms (case: 1 room)`, async () => {
    const rooms = [{ status: MatrixRoomStatus.JOINED }]
    const storeStub = sinon.stub((<any>client).store, 'get').returns(rooms)

    expect(await client.joinedRooms).to.deep.equal(rooms)
    expect(storeStub.callCount).to.equal(1)
    expect(storeStub.firstCall.args[0]).to.equal('rooms')
  })

  it(`should return invited rooms (case: empty)`, async () => {
    expect(await client.invitedRooms).to.deep.equal([])
  })

  it(`should return invited rooms (case: 1 room)`, async () => {
    const rooms = [{ status: MatrixRoomStatus.INVITED }]
    const storeStub = sinon.stub((<any>client).store, 'get').returns(rooms)

    expect(await client.invitedRooms).to.deep.equal(rooms)
    expect(storeStub.callCount).to.equal(1)
    expect(storeStub.firstCall.args[0]).to.equal('rooms')
  })

  it(`should return left rooms (case: empty)`, async () => {
    expect(await client.leftRooms).to.deep.equal([])
  })

  it(`should return left rooms (case: 1 room)`, async () => {
    const rooms = [{ status: MatrixRoomStatus.LEFT }]
    const storeStub = sinon.stub((<any>client).store, 'get').returns(rooms)

    expect(await client.leftRooms).to.deep.equal(rooms)
    expect(storeStub.callCount).to.equal(1)
    expect(storeStub.firstCall.args[0]).to.equal('rooms')
  })

  it(`should start`, async () => {
    const sendStub = sinon.stub(MatrixHttpClient.prototype, <any>'send')
    const storeStub = sinon
      .stub((<any>client).store, 'get')
      .withArgs('isRunning')
      .returns(false)
    sendStub.withArgs('POST', '/login').resolves({
      user_id: '@pubkey:url',
      access_token: 'access-token',
      home_server: 'url',
      device_id: 'my-id'
    })

    const syncResponse = {
      account_data: { events: [] },
      to_device: { events: [] },
      device_lists: { changed: [], left: [] },
      presence: { events: [] },
      rooms: { join: {}, invite: {}, leave: {} },
      groups: { join: {}, invite: {}, leave: {} },
      device_one_time_keys_count: {},
      next_batch: 's793973_746830_0_1_1_1_1_17384_1'
    }

    const pollStub = sinon.stub(client, <any>'poll').resolves()
    pollStub.callsArgWithAsync(1, syncResponse).resolves()

    await client.start({
      id: 'random-id',
      password: `ed:sig:pubkey`,
      deviceId: 'pubkey'
    })

    expect(storeStub.callCount).to.equal(1)
    expect(sendStub.callCount).to.equal(1)
    expect(pollStub.callCount).to.equal(1)
  })

  it(`should fail start if isRunning is false`, async () => {
    const sendStub = sinon.stub(MatrixHttpClient.prototype, <any>'send')
    const storeStub = sinon
      .stub((<any>client).store, 'get')
      .withArgs('isRunning')
      .returns(false)
    const storeUpdateStub = sinon.stub((<any>client).store, 'update').resolves()
    sendStub.withArgs('POST', '/login').resolves({
      user_id: '@pubkey:url',
      access_token: 'access-token',
      home_server: 'url',
      device_id: 'my-id'
    })

    const pollStub = sinon.stub(client, <any>'poll').resolves()
    pollStub.callsArgWithAsync(2, new Error('expected error')).resolves()

    try {
      await client.start({
        id: 'random-id',
        password: `ed:sig:pubkey`,
        deviceId: 'pubkey'
      })
    } catch (e) {
      expect((e as any).message).to.equal('expected error')
      expect(storeStub.callCount).to.equal(1)
      expect(sendStub.callCount).to.equal(1)
      expect(pollStub.callCount).to.equal(1)
      expect(storeUpdateStub.callCount).to.equal(2)
    }
  })

  it(`should subscribe`, async () => {
    const onStub = sinon.stub((<any>client).eventEmitter, 'on').resolves()

    const cb = () => null
    client.subscribe(MatrixClientEventType.MESSAGE, cb)

    expect(onStub.callCount).to.equal(1)
    expect(onStub.firstCall.args[0]).to.equal(MatrixClientEventType.MESSAGE)
    expect(onStub.firstCall.args[1]).to.equal(cb)
  })

  it(`should unsubscribe one`, async () => {
    const removeStub = sinon.stub((<any>client).eventEmitter, 'removeListener').resolves()
    const removeAllStub = sinon.stub((<any>client).eventEmitter, 'removeAllListeners').resolves()

    const cb = () => null
    client.unsubscribe(MatrixClientEventType.MESSAGE, cb)

    expect(removeAllStub.callCount).to.equal(0)
    expect(removeStub.callCount).to.equal(1)
    expect(removeStub.firstCall.args[0]).to.equal(MatrixClientEventType.MESSAGE)
    expect(removeStub.firstCall.args[1]).to.equal(cb)
  })

  it(`should unsubscribe all events`, async () => {
    const removeStub = sinon.stub((<any>client).eventEmitter, 'removeListener').resolves()

    client.unsubscribeAll(MatrixClientEventType.MESSAGE)

    expect(removeStub.callCount).to.equal(1)
    expect(removeStub.firstCall.args[0]).to.equal(MatrixClientEventType.MESSAGE)
    expect(removeStub.firstCall.args[1]).to.equal(undefined)
  })

  it(`should get a room by id`, async () => {
    const getRoomStub = sinon.stub((<any>client).store, 'getRoom').resolves()

    const id = 'my-id'
    await client.getRoomById(id)

    expect(getRoomStub.callCount).to.equal(1)
    expect(getRoomStub.firstCall.args[0]).to.equal(id)
  })

  it(`should create a trusted private room`, async () => {
    const getAccessTokenStub = sinon
      .stub((<any>client).store, 'get')
      .withArgs('accessToken')
      .resolves('my-token')
    const eventSyncSpy = sinon.spy((<any>client).roomService, 'createRoom')
    const sendStub = sinon.stub(MatrixHttpClient.prototype, <any>'send')
    sendStub.resolves({
      room_id: 'my-id'
    })

    const syncSpy = sinon.spy(client, <any>'requiresAuthorization')

    const roomId = await client.createTrustedPrivateRoom('1', '2', '3')

    expect(getAccessTokenStub.callCount).to.equal(1)
    expect(syncSpy.callCount).to.equal(1)
    expect(eventSyncSpy.callCount).to.equal(1)
    expect(roomId).to.equal('my-id')
  })

  it(`should invite a user to a room`, async () => {
    const getAccessTokenStub = sinon
      .stub((<any>client).store, 'get')
      .withArgs('accessToken')
      .resolves('my-token')
    const sendStub = sinon.stub(MatrixHttpClient.prototype, <any>'send')
    sendStub.withArgs('POST', '/rooms/my-id/invite').resolves({
      type: 'room_invite'
    })

    const getRoomStub = sinon
      .stub((<any>client).store, 'getRoom')
      .returns({ id: 'my-id', status: MatrixRoomStatus.JOINED })

    const eventSyncSpy = sinon.spy((<any>client).roomService, 'inviteToRoom')

    const syncSpy = sinon.spy(client, <any>'requiresAuthorization')

    await client.inviteToRooms('user', '1', '2', '3')

    expect(getAccessTokenStub.callCount).to.equal(1)
    expect(syncSpy.callCount).to.equal(1)
    expect(getRoomStub.callCount).to.equal(3)
    expect(eventSyncSpy.callCount).to.equal(3)
  })

  it(`should join rooms`, async () => {
    const getAccessTokenStub = sinon
      .stub((<any>client).store, 'get')
      .withArgs('accessToken')
      .resolves('my-token')

    const getRoomStub = sinon.stub((<any>client).store, 'getRoom').returns('room')
    const eventSyncStub = sinon.stub((<any>client).roomService, 'joinRoom').resolves()

    const syncSpy = sinon.spy(client, <any>'requiresAuthorization')

    await client.joinRooms('1', '2', '3')

    expect(getAccessTokenStub.callCount).to.equal(1)
    expect(syncSpy.callCount).to.equal(1)
    expect(getRoomStub.callCount).to.equal(3)
    expect(eventSyncStub.callCount).to.equal(3)
  })

  it(`should send a text message`, async () => {
    return new Promise(async (resolve) => {
      const getRoomStub = sinon.stub((<any>client).store, 'getRoom').returns('room')
      const createTxnIdStub = sinon
        .stub(<any>MatrixClient.prototype, 'createTxnId')
        .resolves('random-id')

      const eventSyncStub = sinon.stub((<any>client).eventService, 'sendMessage').resolves()

      const syncStub = sinon
        .stub(client, <any>'requiresAuthorization')
        .callsArgWithAsync(1, 'myToken')
        .resolves()

      await client.sendTextMessage('123', 'my-message')

      expect(getRoomStub.callCount, 'getRoomStub').to.equal(0)
      setTimeout(() => {
        expect(createTxnIdStub.callCount, 'createTxnId').to.equal(1)
        expect(syncStub.callCount, 'syncStub').to.equal(1)
        expect(eventSyncStub.callCount, 'eventSyncStub').to.equal(1)
        resolve()
      }, 0)
    })
  })

  it(`should poll the server for updates`, async () => {
    return new Promise(async (resolve) => {
      const sendStub = sinon.stub(MatrixHttpClient.prototype, <any>'send')
      sendStub.withArgs('GET', '/sync').resolves()

      const successResponse = 'my-response'
      const getStub = sinon.stub((<any>client).store, 'get').returns(3)
      const syncStub = sinon.stub(client, <any>'sync').returns(successResponse)

      // Stop the requests after 1s, otherwise it will retry forever
      setTimeout(() => {
        client.stop()
      }, 1000)
      ;(<any>client)
        .poll(
          0,
          (response: any) => {
            expect(response).to.equal(successResponse)
            expect(getStub.callCount).to.equal(0)
            expect(syncStub.callCount).to.equal(1) // The second time polling is done, this will fail and invoke the error callback
          },
          async () => {}
        )
        .catch(() => {
          resolve()
        })
    })
  })

  it(`should sync with the server`, async () => {
    const getStub = sinon.stub((<any>client).store, 'get').returns('something')

    const eventSyncStub = sinon.stub((<any>client).eventService, 'sync').resolves()

    const syncStub = sinon
      .stub(client, <any>'requiresAuthorization')
      .callsArgWithAsync(1, 'myToken')
      .resolves()

    await (<any>client).sync()

    expect(getStub.callCount).to.equal(2)
    expect(syncStub.callCount).to.equal(1)
    expect(eventSyncStub.callCount).to.equal(1)
  })

  it(`should send a sync request to the server`, async () => {
    const getStub = sinon.stub((<any>client).store, 'get').returns('test-item')

    const eventSyncStub = sinon.stub((<any>client).eventService, 'sync').resolves()

    const syncStub = sinon
      .stub(client, <any>'requiresAuthorization')
      .callsArgWithAsync(1, 'myToken')
      .resolves()

    await (<any>client).sync()

    expect(getStub.callCount).to.equal(2)
    expect(syncStub.callCount).to.equal(1)
    expect(eventSyncStub.callCount).to.equal(1)
  })

  it(`should check if an access token is present`, async () => {
    const myToken = 'my-token'

    const getStub = sinon.stub((<any>client).store, 'get').returns(myToken)

    return new Promise(async (resolve, _reject) => {
      const cb = (token: string) => {
        expect(token).to.equal(myToken)
        expect(getStub.callCount).to.equal(1)

        resolve()
      }

      await (<any>client).requiresAuthorization('my-name', cb)
    })
  })

  it(`should create a transaction id`, async () => {
    const counter = 1
    const getStub = sinon.stub((<any>client).store, 'get').returns(counter)
    const updateStub = sinon.stub((<any>client).store, 'update').resolves()

    const id = await (<any>client).createTxnId()

    expect(getStub.callCount).to.equal(1)
    expect(updateStub.callCount).to.equal(1)
    expect(updateStub.firstCall.args[0]).to.deep.equal({
      txnNo: counter + 1
    })
    expect(id.startsWith('m')).to.be.true
    expect(id.includes('.')).to.be.true
    expect(id.includes(counter)).to.be.true
  })
})
