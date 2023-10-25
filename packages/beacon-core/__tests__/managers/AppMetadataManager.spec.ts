import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { AppMetadataManager } from '../../src/managers/AppMetadataManager'

import { AppMetadata } from '@mavrykdynamics/beacon-types'
import { FileStorage, writeLocalFile } from '../../../../test/test-utils/FileStorage'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const appMetadata1: AppMetadata = {
  senderId: 'id1',
  name: 'name1',
  icon: 'icon1'
}

const appMetadata2: AppMetadata = {
  senderId: 'id2',
  name: 'name2',
  icon: 'icon2'
}

const appMetadata3: AppMetadata = {
  senderId: 'id3',
  name: 'name3',
  icon: 'icon3'
}

describe(`AppMetadataManager`, () => {
  let manager: AppMetadataManager
  beforeEach(async () => {
    await writeLocalFile({})

    manager = new AppMetadataManager(new FileStorage())
  })
  it(`reads and adds appMetadata`, async () => {
    const appMetadataBefore: AppMetadata[] = await manager.getAppMetadataList()
    expect(appMetadataBefore.length, 'before').to.equal(0)

    await manager.addAppMetadata(appMetadata1)
    const appMetadataAfter: AppMetadata[] = await manager.getAppMetadataList()

    expect(appMetadataAfter.length, 'after').to.equal(1)
  })

  it(`overwrites an existing appMetadata`, async () => {
    const appMetadataBefore: AppMetadata[] = await manager.getAppMetadataList()
    expect(appMetadataBefore.length, 'before').to.equal(0)

    await manager.addAppMetadata(appMetadata1)
    const appMetadataAfterAdding: AppMetadata[] = await manager.getAppMetadataList()

    expect(appMetadataAfterAdding.length, 'after adding').to.equal(1)

    const newAppMetadata1: AppMetadata = { ...appMetadata1, name: 'new name' }

    await manager.addAppMetadata(newAppMetadata1)
    const appMetadataAfterReplacing: AppMetadata[] = await manager.getAppMetadataList()

    expect(appMetadataAfterReplacing.length, 'after replacing').to.equal(1)
    expect(appMetadataAfterReplacing[0].name, 'after replacing').to.deep.equal(newAppMetadata1.name)
  })

  it(`reads and adds multiple appMetadata`, async () => {
    const appMetadataBefore: AppMetadata[] = await manager.getAppMetadataList()
    expect(appMetadataBefore.length, 'before').to.equal(0)

    await manager.addAppMetadata(appMetadata1)
    await manager.addAppMetadata(appMetadata2)
    const appMetadataAfter: AppMetadata[] = await manager.getAppMetadataList()

    expect(appMetadataAfter.length, 'after').to.equal(2)
  })

  it(`only adds an appMetadata once`, async () => {
    const appMetadataBefore: AppMetadata[] = await manager.getAppMetadataList()
    expect(appMetadataBefore.length, 'before').to.equal(0)

    await manager.addAppMetadata(appMetadata1)
    await manager.addAppMetadata(appMetadata1)
    const appMetadataAfter: AppMetadata[] = await manager.getAppMetadataList()

    expect(appMetadataAfter.length, 'after').to.equal(1)
  })

  it(`reads one appMetadata`, async () => {
    const appMetadataBefore: AppMetadata[] = await manager.getAppMetadataList()
    expect(appMetadataBefore.length, 'before').to.equal(0)

    await manager.addAppMetadata(appMetadata1)
    await manager.addAppMetadata(appMetadata2)
    const appMetadata = await manager.getAppMetadata(appMetadata1.senderId)
    expect(appMetadata, 'after').to.deep.include(appMetadata1)
  })

  it(`removes one appMetadata`, async () => {
    const appMetadataBefore: AppMetadata[] = await manager.getAppMetadataList()
    expect(appMetadataBefore.length, 'before').to.equal(0)

    await manager.addAppMetadata(appMetadata1)
    await manager.addAppMetadata(appMetadata2)
    await manager.addAppMetadata(appMetadata3)
    const appMetadataAfter: AppMetadata[] = await manager.getAppMetadataList()

    expect(appMetadataAfter.length, 'after add').to.equal(3)

    await manager.removeAppMetadata(appMetadata1.senderId)
    const appMetadataAfterRemove: AppMetadata[] = await manager.getAppMetadataList()

    expect(appMetadataAfterRemove.length, 'after remove').to.equal(2)
    expect(appMetadataAfterRemove, 'after remove, appMetadata2').to.deep.include(appMetadata2)
    expect(appMetadataAfterRemove, 'after remove, appMetadata3').to.deep.include(appMetadata3)
  })

  it(`removes many appMetadata items`, async () => {
    const appMetadataBefore: AppMetadata[] = await manager.getAppMetadataList()
    expect(appMetadataBefore.length, 'before').to.equal(0)

    await manager.addAppMetadata(appMetadata1)
    await manager.addAppMetadata(appMetadata2)
    await manager.addAppMetadata(appMetadata3)
    const appMetadataAfter: AppMetadata[] = await manager.getAppMetadataList()

    expect(appMetadataAfter.length, 'after add').to.equal(3)

    await manager.removeAppMetadatas([appMetadata1.senderId, appMetadata2.senderId])
    const appMetadataAfterRemove: AppMetadata[] = await manager.getAppMetadataList()

    expect(appMetadataAfterRemove.length, 'after remove').to.equal(1)
    expect(appMetadataAfterRemove, 'after remove').to.deep.include(appMetadata3)
  })

  it(`removes all appMetadata items`, async () => {
    const appMetadataBefore: AppMetadata[] = await manager.getAppMetadataList()
    expect(appMetadataBefore.length, 'before').to.equal(0)

    await manager.addAppMetadata(appMetadata1)
    await manager.addAppMetadata(appMetadata2)
    await manager.addAppMetadata(appMetadata3)
    const appMetadataAfter: AppMetadata[] = await manager.getAppMetadataList()

    expect(appMetadataAfter.length, 'after add').to.equal(3)

    await manager.removeAllAppMetadata()
    const appMetadataAfterRemove: AppMetadata[] = await manager.getAppMetadataList()

    expect(appMetadataAfterRemove.length, 'after remove').to.equal(0)
  })
})
