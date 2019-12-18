import { FileStorage } from "./FileStorage"
import { LocalStorage } from "./LocalStorage"
import { Storage } from "./Storage"

export async function getStorage(): Promise<Storage> {
    const local: LocalStorage = new LocalStorage()
    const file: FileStorage = new FileStorage()
    if (await local.isSupported()) {
        return local
    } else if (await file.isSupported()) {
        return file
    } else {
        throw new Error('no storage type supported')
    }
}