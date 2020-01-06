import { readFile, writeFile } from 'fs'

import { Storage } from './Storage'

const file: string = './storage.json'

interface JsonObject {
  [key: string]: unknown
}

/* eslint-disable prefer-arrow/prefer-arrow-functions */

function readLocalFile(): Promise<JsonObject> {
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

function writeLocalFile(json: JsonObject): Promise<void> {
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

  public async get(key: string): Promise<unknown> {
    const json: JsonObject = await readLocalFile()

    return json[key]
  }

  public async set(key: string, value: string): Promise<void> {
    const json: JsonObject = await readLocalFile()
    json[key] = value

    return writeLocalFile(json)
  }

  public async delete(key: string): Promise<void> {
    const json: JsonObject = await readLocalFile()
    json[key] = undefined

    return writeLocalFile(json)
  }
}
