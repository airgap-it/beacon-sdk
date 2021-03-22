import { readFileSync, writeFileSync } from 'fs'
import { getFilesRecursively } from './get-files-in-folder'

const addJs = (content: string) => {
  const js = `\t<script>
    let externals = localStorage.getItem('externals')
    if (externals === null) {
        localStorage.setItem('externals', false)
    }
    let visibility = localStorage.getItem('visibility')
    if (visibility === null) {
        localStorage.setItem('visibility', 'public')
    }
</script>`
  return content
    .split(`<link rel="stylesheet" href="assets/css/main.css">`)
    .join(`<link rel="stylesheet" href="assets/css/main.css">\n${js}\n`)
}

const updateFile = (filename: string) => {
  const content = readFileSync(filename, 'utf8')

  const newContent = content
    .split(`<label class="tsd-widget" for="tsd-filter-externals">Externals</label>`)
    .join(`<label class="tsd-widget" for="tsd-filter-externals">Internal Definitions</label>`)

  writeFileSync(filename, addJs(newContent), { encoding: 'utf8' })
}

getFilesRecursively('./docs/')
  .filter((el) => el.endsWith('.html'))
  .forEach((element) => {
    updateFile(element)
  })

console.log('Injected beacon docs code.')
