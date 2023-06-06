export type TezosSaplingTransferResponse =
  | {
      operationHash: string
    }
  | {
      operationHash: string
      signature: string
      payload?: string
    }
  | {
      signature: string
      payload?: string
    }
