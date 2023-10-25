import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { PermissionManager } from '../../src/managers/PermissionManager'

import { PermissionInfo, NetworkType, PermissionScope } from '@mavrykdynamics/beacon-types'
import { FileStorage, writeLocalFile } from '../../../../test/test-utils/FileStorage'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const permission1: PermissionInfo = {
  accountIdentifier: 'a1',
  senderId: 'id1',
  appMetadata: { senderId: 'id1', name: 'name1' },
  website: 'website1',
  address: 'tz1',
  publicKey: 'publicKey1',
  network: { type: NetworkType.MAINNET },
  scopes: [PermissionScope.SIGN],
  connectedAt: new Date().getTime()
}

const permission2: PermissionInfo = {
  accountIdentifier: 'a2',
  senderId: 'id2',
  appMetadata: { senderId: 'id2', name: 'name2' },
  website: 'website2',
  address: 'tz2',
  publicKey: 'publicKey2',
  network: { type: NetworkType.MAINNET },
  scopes: [PermissionScope.SIGN],
  connectedAt: new Date().getTime()
}

const permission3: PermissionInfo = {
  accountIdentifier: 'a3',
  senderId: 'id3',
  appMetadata: { senderId: 'id3', name: 'name3' },
  website: 'website3',
  address: 'tz3',
  publicKey: 'publicKey3',
  network: { type: NetworkType.MAINNET },
  scopes: [PermissionScope.SIGN],
  connectedAt: new Date().getTime()
}

describe(`PermissionManager`, () => {
  let manager: PermissionManager
  beforeEach(async () => {
    await writeLocalFile({})

    manager = new PermissionManager(new FileStorage())
  })
  it(`reads and adds permissions`, async () => {
    const permissionsBefore: PermissionInfo[] = await manager.getPermissions()
    expect(permissionsBefore.length, 'before').to.equal(0)

    await manager.addPermission(permission1)
    const permissionsAfter: PermissionInfo[] = await manager.getPermissions()

    expect(permissionsAfter.length, 'after').to.equal(1)
  })

  it(`overwrites an existing permission`, async () => {
    const permissionsBefore: PermissionInfo[] = await manager.getPermissions()
    expect(permissionsBefore.length, 'before').to.equal(0)

    await manager.addPermission(permission1)
    const permissionsAfterAdding: PermissionInfo[] = await manager.getPermissions()

    expect(permissionsAfterAdding.length, 'after adding').to.equal(1)

    const newPermission1: PermissionInfo = {
      ...permission1,
      scopes: [PermissionScope.OPERATION_REQUEST]
    }

    await manager.addPermission(newPermission1)
    const permissionsAfterReplacing: PermissionInfo[] = await manager.getPermissions()

    expect(permissionsAfterReplacing.length, 'after replacing').to.equal(1)
    expect(permissionsAfterReplacing[0].scopes, 'after replacing').to.deep.equal(
      newPermission1.scopes
    )
  })

  it(`reads and adds multiple permissions`, async () => {
    const permissionsBefore: PermissionInfo[] = await manager.getPermissions()
    expect(permissionsBefore.length, 'before').to.equal(0)

    await manager.addPermission(permission1)
    await manager.addPermission(permission2)
    const permissionsAfter: PermissionInfo[] = await manager.getPermissions()

    expect(permissionsAfter.length, 'after').to.equal(2)
  })

  it(`only adds an permission once`, async () => {
    const permissionsBefore: PermissionInfo[] = await manager.getPermissions()
    expect(permissionsBefore.length, 'before').to.equal(0)

    await manager.addPermission(permission1)
    await manager.addPermission(permission1)
    const permissionsAfter: PermissionInfo[] = await manager.getPermissions()

    expect(permissionsAfter.length, 'after').to.equal(1)
  })

  it(`reads one permission`, async () => {
    const permissionsBefore: PermissionInfo[] = await manager.getPermissions()
    expect(permissionsBefore.length, 'before').to.equal(0)

    await manager.addPermission(permission1)
    await manager.addPermission(permission2)
    const permission = await manager.getPermission(permission1.accountIdentifier)
    expect(permission, 'after').to.deep.include(permission1)
  })

  it(`removes one permission`, async () => {
    const permissionsBefore: PermissionInfo[] = await manager.getPermissions()
    expect(permissionsBefore.length, 'before').to.equal(0)

    await manager.addPermission(permission1)
    await manager.addPermission(permission2)
    await manager.addPermission(permission3)
    const permissionsAfter: PermissionInfo[] = await manager.getPermissions()

    expect(permissionsAfter.length, 'after add').to.equal(3)

    await manager.removePermission(permission1.accountIdentifier)
    const permissionsAfterRemove: PermissionInfo[] = await manager.getPermissions()

    expect(permissionsAfterRemove.length, 'after remove').to.equal(2)
    expect(permissionsAfterRemove, 'after remove, permission2').to.deep.include(permission2)
    expect(permissionsAfterRemove, 'after remove, permission3').to.deep.include(permission3)
  })

  it(`removes many permissions`, async () => {
    const permissionsBefore: PermissionInfo[] = await manager.getPermissions()
    expect(permissionsBefore.length, 'before').to.equal(0)

    await manager.addPermission(permission1)
    await manager.addPermission(permission2)
    await manager.addPermission(permission3)
    const permissionsAfter: PermissionInfo[] = await manager.getPermissions()

    expect(permissionsAfter.length, 'after add').to.equal(3)

    await manager.removePermissions([permission1.accountIdentifier, permission2.accountIdentifier])
    const permissionsAfterRemove: PermissionInfo[] = await manager.getPermissions()

    expect(permissionsAfterRemove.length, 'after remove').to.equal(1)
    expect(permissionsAfterRemove, 'after remove').to.deep.include(permission3)
  })

  it(`removes all permissions`, async () => {
    const permissionsBefore: PermissionInfo[] = await manager.getPermissions()
    expect(permissionsBefore.length, 'before').to.equal(0)

    await manager.addPermission(permission1)
    await manager.addPermission(permission2)
    await manager.addPermission(permission3)
    const permissionsAfter: PermissionInfo[] = await manager.getPermissions()

    expect(permissionsAfter.length, 'after add').to.equal(3)

    await manager.removeAllPermissions()
    const permissionsAfterRemove: PermissionInfo[] = await manager.getPermissions()

    expect(permissionsAfterRemove.length, 'after remove').to.equal(0)
  })
})
