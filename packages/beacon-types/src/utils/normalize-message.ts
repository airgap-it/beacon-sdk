import { BeaconMessageType } from "../types/beacon/BeaconMessageType"
import { BeaconMessage } from "../types/beacon/BeaconMessage"
import { OperationResponse } from "../types/beacon/messages/OperationResponse"
import { BroadcastResponse } from "../types/beacon/messages/BroadcastResponse"

export function normalizeMessage<T extends BeaconMessage>(message: T): T {
    if (message.type === BeaconMessageType.OperationResponse) {
        const operationResponse: OperationResponse = {
            type: message.type,
            version: message.version,
            id: message.id,
            senderId: message.senderId,
            operationHash: message.operationHash ?? /* backwards compatibility */ (message as any).transactionHash
        }

        return operationResponse as T
    }

    if (message.type === BeaconMessageType.BroadcastResponse) {
        const broadcastResponse: BroadcastResponse = {
            type: message.type,
            version: message.version,
            id: message.id,
            senderId: message.senderId,
            operationHash: message.operationHash ?? /* backwards compatibility */ (message as any).transactionHash
        }

        return broadcastResponse as T
    }

    return message
}