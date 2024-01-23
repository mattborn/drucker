const fs = require('fs')

const sortBy = (arr, ...keys) => {
  return arr.sort((a, b) => {
    for (let key of keys) {
      let valA = a[key]
      let valB = b[key]

      if (Date.parse(valA) && Date.parse(valB)) {
        valA = new Date(valA)
        valB = new Date(valB)
      }

      if (valA < valB) return -1
      if (valA > valB) return 1
    }
    return 0
  })
}

// borrowed from /apps/utils.js
const sortProperties = obj => {
  return Object.keys(obj)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = obj[key]
      return sorted
    }, {})
}

const writeFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
}

// for deterministic sorting of objects and properties

try {
  const metaPath = './meta.json'
  const meta = JSON.parse(fs.readFileSync(metaPath))

  meta.logs = sortBy(meta.logs, 'file')
  meta.logs = meta.logs.map(log => sortProperties(log))
  writeFile(metaPath, meta)

  meta.logs.forEach(log => {
    const jsonPath = `./${log.file}`
    if (!fs.existsSync(jsonPath)) writeFile(jsonPath, []) // stub file
    let events = JSON.parse(fs.readFileSync(jsonPath)) || []
    events = sortBy(events, 'date')
    events = events.map(event => sortProperties(event))
    writeFile(jsonPath, events)
    console.log(`${log.label} has ${events.length} events`)
  })
} catch (error) {
  console.error(error)
}
