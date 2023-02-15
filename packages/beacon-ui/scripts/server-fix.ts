const fs = require('fs')

// Read the file into a string
let fileData = fs.readFileSync('./dist/cjs/index.js', 'utf8')

// Define the code you want to insert
const codeToInsert = `if (web.isServer) {
    web.template = () => {
      return { cloneNode: () => {} }
    }
  }`

// Split the file into an array of lines
let fileLines = fileData.split('\n')

// Insert the code into the desired line (line number starting from 0)
const lineToInsert = 5 
fileLines.splice(lineToInsert, 0, codeToInsert)

// Join the modified lines into a string
fileData = fileLines.join('\n')

// Write the modified file back to disk
fs.writeFileSync('./dist/cjs/index.js', fileData)
