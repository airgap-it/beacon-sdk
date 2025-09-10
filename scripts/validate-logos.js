const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

let hasErrors = false

// Load blockchain TypeScript files to get expected logo files
const blockchainFiles = [
  'scripts/blockchains/tezos.ts',
  'scripts/blockchains/substrate.ts',
  'scripts/blockchains/tezos-sapling.ts'
]
const expectedLogos = new Set()

blockchainFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8')
    // Extract logo filenames from the TypeScript files
    const logoMatches = content.match(/logo:\s*['"]([^'"]+)['"]/g)
    if (logoMatches) {
      logoMatches.forEach(match => {
        const logo = match.match(/logo:\s*['"]([^'"]+)['"]/)[1]
        expectedLogos.add(logo)
      })
    }
  }
})

// Check all logo files in assets/logos
const logosDir = 'assets/logos'
const logoFiles = fs.readdirSync(logosDir)

async function validateImage(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase()
  const fileSize = fs.statSync(filePath).size
  
  // Check file size (max 25KB)
  if (fileSize > 25 * 1024) {
    console.error(`${fileName}: File size ${(fileSize / 1024).toFixed(2)}KB exceeds 25KB limit`)
    hasErrors = true
    return
  }
  
  // Check file format
  if (!['.png', '.svg'].includes(ext)) {
    console.error(`${fileName}: Invalid format. Only PNG and SVG are allowed`)
    hasErrors = true
    return
  }
  
  // Check dimensions for PNG files
  if (ext === '.png') {
    try {
      const metadata = await sharp(filePath).metadata()
      if (metadata.width > 256 || metadata.height > 256) {
        console.error(`${fileName}: Dimensions ${metadata.width}x${metadata.height} exceed 256x256 limit`)
        hasErrors = true
      } else {
        console.log(`${fileName}: Valid PNG (${metadata.width}x${metadata.height}, ${(fileSize / 1024).toFixed(2)}KB)`)
      }
    } catch (error) {
      console.error(`${fileName}: Failed to read image metadata`)
      hasErrors = true
    }
  } else {
    console.log(`${fileName}: Valid SVG (${(fileSize / 1024).toFixed(2)}KB)`)
  }
}

// Validate each logo file
const validationPromises = logoFiles.map(file => {
  const filePath = path.join(logosDir, file)
  if (fs.statSync(filePath).isFile()) {
    // Check if logo is referenced in wallet lists
    if (!expectedLogos.has(file) && file !== 'beacon_logo.svg') {
      console.warn(`${file}: Not referenced in any wallet list`)
    }
    return validateImage(filePath, file)
  }
})

Promise.all(validationPromises).then(() => {
  // Check for missing logos
  expectedLogos.forEach(expectedLogo => {
    const logoPath = path.join(logosDir, expectedLogo)
    if (!fs.existsSync(logoPath)) {
      console.error(`Missing logo file: ${expectedLogo}`)
      hasErrors = true
    }
  })
  
  if (hasErrors) {
    console.error('\nLogo validation failed! Please fix the issues above.')
    process.exit(1)
  } else {
    console.log('\nAll logo files are valid!')
  }
})