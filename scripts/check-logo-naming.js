const fs = require('fs')
const path = require('path')

// Check that logo filenames match wallet keys
const blockchainFiles = [
  'scripts/blockchains/tezos.ts',
  'scripts/blockchains/substrate.ts',
  'scripts/blockchains/tezos-sapling.ts'
]
let hasNamingIssues = false

blockchainFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8')
    // Extract wallet entries with key and logo
    const walletMatches = content.match(/\{[^}]*key:\s*['"]([^'"]+)['""][^}]*logo:\s*['"]([^'"]+)['""][^}]*\}/g)
    if (walletMatches) {
      walletMatches.forEach(match => {
        const keyMatch = match.match(/key:\s*['"]([^'"]+)['"]/)
        const logoMatch = match.match(/logo:\s*['"]([^'"]+)['"]/)
        if (keyMatch && logoMatch) {
          const key = keyMatch[1]
          const logo = logoMatch[1]
          const expectedLogo = key + path.extname(logo)
          if (logo !== expectedLogo && logo !== key + '.png' && logo !== key + '.svg') {
            console.error(`Wallet '${key}' logo should be '${expectedLogo}' but is '${logo}'`)
            hasNamingIssues = true
          }
        }
      })
    }
  }
})

if (hasNamingIssues) {
  console.error('\nLogo naming convention check failed!')
  process.exit(1)
} else {
  console.log('All logos follow naming convention!')
}