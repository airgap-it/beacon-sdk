import { SigningType } from '..'

/**
 * @category DApp
 */
export interface RequestSignPayloadInput {
  signingType?: SigningType
  payload: string
  sourceAddress?: string
}
