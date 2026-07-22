import * as path from 'node:path'
import * as os from 'node:os'
import fs from 'fs'

const OUTPUT_DATA_FILE = path.join(process.cwd(), 'tmp', 'OUTPUT.txt')

export default (key: string, value: string) => {
  fs.mkdirSync(path.dirname(OUTPUT_DATA_FILE), { recursive: true })
  fs.appendFileSync(OUTPUT_DATA_FILE, `${key}=${value}${os.EOL}`)
}
