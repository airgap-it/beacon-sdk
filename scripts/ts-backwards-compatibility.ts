import { readFileSync, writeFileSync } from 'fs'

const replaceInFile: (file: string, src: string, dest: string) => void = (file: string, src: string, dest: string): void => {
  const content: string = readFileSync(file, 'utf-8')
  const newContent: string = content.split(src).join(dest)
  writeFileSync(file, newContent)
}

replaceInFile('./dist/client/storage/FileStorage.js', 'const fs_1 = require("fs");', '// const fs_1 = require("fs");')
replaceInFile('./dist/client/clients/Client.d.ts', 'get isConnected(): Promise<boolean>;', 'readonly isConnected: Promise<boolean>;')
replaceInFile('./dist/client/transports/Transport.d.ts', 'get connectionStatus(): TransportStatus;', 'readonly connectionStatus: TransportStatus;')
