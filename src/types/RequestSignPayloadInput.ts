import { SigningType } from '..'

export interface RequestSignPayloadInput {
  signingType?: SigningType
  payload: string
  sourceAddress?: string
}
