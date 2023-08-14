export interface JsonRPCResponse<T> {
    id: number
    jsonrpc: "2.0"
    result: T
}

export interface JsonRPCError {
    id: number
    jsonrpc: "2.0"
    error: {
        version: string
        errorType: string
        description?: string
    }
}