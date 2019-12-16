import { readFile, writeFile } from 'fs'

import { Storage } from './Storage'

const file: string = './storage.json'

interface JsonObject {
  [key: string]: any
}

function readLocalFile(): Promise<JsonObject> {
  return new Promise((resolve, reject) => {
    readFile(file, { encoding: 'utf8' }, (err, result) => {
      if (err) {
        reject(err)
      }
      try {
        const json: JsonObject = JSON.parse(result)
        resolve(json)
      } catch (e) {
        reject(e)
      }
    })
  })
}

function writeLocalFile(json: JsonObject): Promise<void> {
  return new Promise(resolve => {
    const data: string = JSON.stringify(json)
    writeFile(data, { encoding: 'utf8' }, () => {
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
  public async isSupported(): Promise<boolean> {
    return Promise.resolve(typeof global !== 'undefined')
  }

  public async get(key: string): Promise<any> {
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
    delete json[key]

    return writeLocalFile(json)
  }
}
