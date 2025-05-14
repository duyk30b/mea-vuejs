import * as fs from 'fs'

const time = new Date().toISOString()
console.log('🚀 ~ Write config with: time =', time)

fs.writeFileSync('./public/config.json', JSON.stringify({ buildTime: time }, null, 2))
