import { dirname, join } from 'node:path'
import { EOL } from 'node:os'
import { appendFileSync, mkdirSync } from 'node:fs'

export default (value: string, filename = 'TEST_ENV.txt') => {
  const DATA_FILE = join(process.cwd(), 'tmp', filename)
  mkdirSync(dirname(DATA_FILE), { recursive: true })
  appendFileSync(DATA_FILE, `${value}${EOL}`)
}
