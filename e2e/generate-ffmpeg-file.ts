import { writeFileSync, readdirSync } from 'fs'

const generateFFMPEGFile = (path: string) => {
  const files = readdirSync(path)

  const output = files
    .filter((file) => file.endsWith('.jpg'))
    .map((file, i, arr) => {
      let duration = 100
      if (i + 1 < arr.length) {
        const currentTimestamp = Number(file.slice(7, 13))
        const futureTimestamp = Number(arr[i + 1].slice(7, 13))
        duration = futureTimestamp - currentTimestamp
      }
      console.log(file, duration)
      return `file '${file}'\nduration ${duration / 1000}`
    })
    .join('\n')

  writeFileSync(`${path}/input.txt`, output)
}

generateFFMPEGFile('./e2e/output/dapp')
generateFFMPEGFile('./e2e/output/wallet')
