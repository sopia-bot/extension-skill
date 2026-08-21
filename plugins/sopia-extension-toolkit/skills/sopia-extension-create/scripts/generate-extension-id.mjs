import { randomBytes } from 'node:crypto'

process.stdout.write(randomBytes(9).toString('base64url'))
