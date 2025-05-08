import { SigningType } from './beacon/SigningType'

/**
 * @category DApp
 */
export interface RequestSignPayloadInput {
  signingType?: SigningType
  payload: string
  sourceAddress?: string
}
