import { readFile, writeFile } from 'fs'
import { defaultValues, Storage, StorageKey, StorageKeyReturnType } from '@mavrykdynamics/beacon-types'

const file: string = './storage.json'

interface JsonObject {
  [key: string]: unknown
}

/* eslint-disable prefer-arrow/prefer-arrow-functions */

export function readLocalFile(): Promise<JsonObject> {
  return new Promise((resolve: (_: JsonObject) => void, reject: (error: unknown) => void): void => {
    readFile(file, { encoding: 'utf8' }, (fileReadError: unknown, fileContent: string) => {
      if (fileReadError) {
        reject(fileReadError)
      }
      try {
        const json: JsonObject = JSON.parse(fileContent)
        resolve(json)
      } catch (jsonParseError) {
        reject(jsonParseError)
      }
    })
  })
}

export function writeLocalFile(json: JsonObject): Promise<void> {
  return new Promise((resolve: (_: void) => void): void => {
    const fileContent: string = JSON.stringify(json)
    writeFile(file, fileContent, { encoding: 'utf8' }, () => {
      resolve()
    })
  })
}

/**
 * This can be used for development in node.
 *
 * DO NOT USE IN PRODUCTION
 */
export class FileStorage implements Storage {
  public static async isSupported(): Promise<boolean> {
    return Promise.resolve(typeof global !== 'undefined')
  }

  public async get<K extends StorageKey>(key: K): Promise<StorageKeyReturnType[K]> {
    const json: JsonObject = await readLocalFile()

    if (json[key]) {
      return json[key] as StorageKeyReturnType[K]
    } else {
      if (typeof defaultValues[key] === 'object') {
        return JSON.parse(JSON.stringify(defaultValues[key]))
      } else {
        return defaultValues[key]
      }
    }
  }

  public async set<K extends StorageKey>(key: K, value: StorageKeyReturnType[K]): Promise<void> {
    const json: JsonObject = await readLocalFile()

    json[key] = value

    return writeLocalFile(json)
  }

  public async delete<K extends StorageKey>(key: K): Promise<void> {
    const json: JsonObject = await readLocalFile()
    json[key] = undefined

    return writeLocalFile(json)
  }
}
