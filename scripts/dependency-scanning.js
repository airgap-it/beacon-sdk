'use strict'

const fs = require('fs')
const audit = require('../audit.json')
const advisories = Object.values(audit.advisories)
const result = []

function getPriority(priority) {
  switch (priority.toLowerCase()) {
    case 'moderate':
      return 'Medium'
    case 'low':
      return 'Low'
    default:
      return 'High'
  }
}

for (const advisory of advisories) {
  const { title, overview, recommendation, severity, url } = advisory
  const message = `${title}\n\n${overview}`
  const cve = advisory.cves && advisory.cves.length ? advisory.cves[0] : null

  result.push({
    message,
    cve,
    cwe: advisory.cwe,
    solution: recommendation,
    url,
    priority: getPriority(severity)
  })
}

const filename = 'gl-dependency-scanning-report.json'
fs.writeFileSync(filename, JSON.stringify(result), 'utf8')
