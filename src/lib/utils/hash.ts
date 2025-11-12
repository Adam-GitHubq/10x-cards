import { createHash } from 'crypto'

export async function computeMD5(input: string): Promise<{ output: string }> {
  if (typeof input !== 'string') {
    throw new TypeError('input must be a string')
  }

  if (input.length === 0) {
    throw new Error('input cannot be empty')
  }

  const hash = createHash('md5').update(input, 'utf8').digest('hex')

  return { output: hash }
}

