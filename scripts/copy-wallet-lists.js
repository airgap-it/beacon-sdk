const fs = require('fs')
const path = require('path')

const SOURCE_DIR = path.join(__dirname, '..', 'wallet-lists')
const PACKAGES = [
  'beacon-blockchain-tezos',
  'beacon-blockchain-substrate', 
  'beacon-blockchain-tezos-sapling',
  'beacon-core',
  'beacon-ui'
]

// Copy wallet-lists to each package's dist folder
PACKAGES.forEach(pkg => {
  const destDir = path.join(__dirname, '..', 'packages', pkg, 'dist', 'wallet-lists')
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  
  // Copy JSON files
  fs.readdirSync(SOURCE_DIR).forEach(file => {
    if (file.endsWith('.json')) {
      const source = path.join(SOURCE_DIR, file)
      const dest = path.join(destDir, file)
      fs.copyFileSync(source, dest)
      console.log(`Copied ${file} to ${pkg}/dist/wallet-lists/`)
    }
  })
})

// Also copy to webpack builds for browser usage (not to examples - they use webpack chunks)
const BROWSER_DIRS = [
  path.join(__dirname, '..', 'webpack_builds', 'sdk'),
  path.join(__dirname, '..', 'webpack_builds', 'dapp'),
  path.join(__dirname, '..', 'webpack_builds', 'wallet')
]

BROWSER_DIRS.forEach(dir => {
  const destDir = path.join(dir, 'wallet-lists')
  
  // Create directory if parent exists
  if (fs.existsSync(dir)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    
    // Copy JSON files
    fs.readdirSync(SOURCE_DIR).forEach(file => {
      if (file.endsWith('.json')) {
        const source = path.join(SOURCE_DIR, file)
        const dest = path.join(destDir, file)
        fs.copyFileSync(source, dest)
        console.log(`Copied ${file} to ${dir}/wallet-lists/`)
      }
    })
  }
})

console.log('Wallet lists copied to all output folders')