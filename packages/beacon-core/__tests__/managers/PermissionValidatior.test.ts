// __tests__/validators/PermissionValidator.test.ts

import { PermissionValidator } from '../../src/managers/PermissionValidator'
import {
  BeaconMessage,
  BeaconMessageType,
  PermissionScope,
  PermissionEntity
} from '@airgap/beacon-types'
import { getAccountIdentifier } from '../../src/utils/get-account-identifier'

// Spy on getAccountIdentifier so we can control its output.
jest.spyOn(
  // We wrap it in an object to be able to spy on the named export
  { getAccountIdentifier },
  'getAccountIdentifier'
)

describe('PermissionValidator.hasPermission', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return true for PermissionRequest messages', async () => {
    const message: BeaconMessage = { type: BeaconMessageType.PermissionRequest } as any
    const result = await PermissionValidator.hasPermission(message, jest.fn(), jest.fn())
    expect(result).toBe(true)
  })

  it('should return true for BroadcastRequest messages', async () => {
    const message: BeaconMessage = { type: BeaconMessageType.BroadcastRequest } as any
    const result = await PermissionValidator.hasPermission(message, jest.fn(), jest.fn())
    expect(result).toBe(true)
  })

  describe('OperationRequest messages', () => {
    const dummyMessage: BeaconMessage = {
      type: BeaconMessageType.OperationRequest,
      sourceAddress: 'addr1',
      network: { type: 'mainnet' }
    } as any

    it('should return false if no permission is found', async () => {
      // Force getAccountIdentifier to return a specific identifier.
      jest.spyOn({ getAccountIdentifier }, 'getAccountIdentifier').mockResolvedValue('account123')
      const getOne = jest.fn().mockResolvedValue(undefined)
      const getAll = jest.fn()
      const result = await PermissionValidator.hasPermission(dummyMessage, getOne, getAll)
      expect(result).toBe(false)
      expect(getOne).toHaveBeenCalledWith('twMeS9XWaTh6Xzarweh')
    })

    it('should return false if permission does not include OPERATION_REQUEST scope', async () => {
      jest.spyOn({ getAccountIdentifier }, 'getAccountIdentifier').mockResolvedValue('account123')
      const permission: PermissionEntity = {
        accountIdentifier: 'account123',
        scopes: [] // Missing the required scope
      } as any
      const getOne = jest.fn().mockResolvedValue(permission)
      const getAll = jest.fn()
      const result = await PermissionValidator.hasPermission(dummyMessage, getOne, getAll)
      expect(result).toBe(false)
    })

    it('should return true if permission includes OPERATION_REQUEST scope', async () => {
      jest.spyOn({ getAccountIdentifier }, 'getAccountIdentifier').mockResolvedValue('account123')
      const permission: PermissionEntity = {
        accountIdentifier: 'account123',
        scopes: [PermissionScope.OPERATION_REQUEST]
      } as any
      const getOne = jest.fn().mockResolvedValue(permission)
      const getAll = jest.fn()
      const result = await PermissionValidator.hasPermission(dummyMessage, getOne, getAll)
      expect(result).toBe(true)
    })
  })

  describe('SignPayloadRequest messages', () => {
    const dummyMessage: BeaconMessage = {
      type: BeaconMessageType.SignPayloadRequest,
      sourceAddress: 'addr1'
    } as any

    it('should return false if no permissions for the sourceAddress are found', async () => {
      const getOne = jest.fn()
      const getAll = jest.fn().mockResolvedValue([])
      const result = await PermissionValidator.hasPermission(dummyMessage, getOne, getAll)
      expect(result).toBe(false)
    })

    it('should return false if permissions exist but none have the SIGN scope', async () => {
      const permissions: PermissionEntity[] = [
        { address: 'addr1', scopes: [] } as any,
        { address: 'addr1', scopes: ['OTHER_SCOPE'] } as any
      ]
      const getOne = jest.fn()
      const getAll = jest.fn().mockResolvedValue(permissions)
      const result = await PermissionValidator.hasPermission(dummyMessage, getOne, getAll)
      expect(result).toBe(false)
    })

    it('should return true if at least one permission has the SIGN scope', async () => {
      const permissions: PermissionEntity[] = [
        { address: 'addr1', scopes: [] } as any,
        { address: 'addr1', scopes: [PermissionScope.SIGN] } as any
      ]
      const getOne = jest.fn()
      const getAll = jest.fn().mockResolvedValue(permissions)
      const result = await PermissionValidator.hasPermission(dummyMessage, getOne, getAll)
      expect(result).toBe(true)
    })
  })

  it('should throw an error for unsupported message types', async () => {
    const message: BeaconMessage = { type: 'UnsupportedType' } as any
    const getOne = jest.fn()
    const getAll = jest.fn()
    await expect(PermissionValidator.hasPermission(message, getOne, getAll)).rejects.toThrow(
      'Message not handled'
    )
  })
})
