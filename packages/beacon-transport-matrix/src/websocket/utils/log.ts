import { serializable } from './serialization'

export function log(tag: string, ...data: any[]): void {
    if (data.length > 0) {
        console.groupCollapsed(tag)
        console.log(...serializable(data))
        console.groupEnd()
    } else {
        console.log(tag)
    }
}