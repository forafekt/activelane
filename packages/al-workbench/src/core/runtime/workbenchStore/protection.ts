import type { WorkbenchTabProtectionMetadata } from '../../workbench/contributions'

const DEFAULT_ITERATIONS = 120_000

function bytesToBase64(bytes: Uint8Array) {
  let value = ''
  bytes.forEach((byte) => {
    value += String.fromCharCode(byte)
  })
  const encode = (globalThis as { btoa?: (input: string) => string }).btoa
  if (!encode) throw new Error('Base64 encoding is required for local tab protection.')
  return encode(value)
}

function base64ToBytes(value: string) {
  const decode = (globalThis as { atob?: (input: string) => string }).atob
  if (!decode) throw new Error('Base64 decoding is required for local tab protection.')
  return Uint8Array.from(decode(value), (char) => char.charCodeAt(0))
}

function bytesToArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
    return bytes
  }
  for (let index = 0; index < length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256)
  }
  return bytes
}

async function deriveHash(secret: string, salt: Uint8Array, iterations: number) {
  const subtle = globalThis.crypto?.subtle
  const encoder = new TextEncoder()
  if (!subtle) throw new Error('Web Crypto is required for local tab protection.')
  const key = await subtle.importKey(
    'raw',
    bytesToArrayBuffer(encoder.encode(secret)),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: bytesToArrayBuffer(salt), iterations },
    key,
    256,
  )
  return bytesToBase64(new Uint8Array(bits))
}

export async function createProtectionMetadata(
  secret: string,
  hint?: string,
): Promise<WorkbenchTabProtectionMetadata> {
  const salt = randomBytes(16)
  return {
    algorithm: 'PBKDF2-SHA-256',
    salt: bytesToBase64(salt),
    hash: await deriveHash(secret, salt, DEFAULT_ITERATIONS),
    iterations: DEFAULT_ITERATIONS,
    hint: hint || undefined,
    createdAt: Date.now(),
  }
}

export async function verifyProtectionSecret(
  metadata: WorkbenchTabProtectionMetadata | null | undefined,
  secret: string,
) {
  if (!metadata) return true
  const hash = await deriveHash(secret, base64ToBytes(metadata.salt), metadata.iterations)
  return hash === metadata.hash
}
