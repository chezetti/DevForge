export function base64Encode(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
}

export function base64Decode(input: string): string {
  return decodeURIComponent(escape(atob(input)))
}

export function urlEncode(input: string): string {
  return encodeURIComponent(input)
}

export function urlDecode(input: string): string {
  return decodeURIComponent(input)
}

export interface JwtParts {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  raw: {
    header: string
    payload: string
    signature: string
  }
}

export function decodeJwt(token: string): JwtParts {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: expected 3 parts separated by dots')
  }

  const [headerB64, payloadB64, signature] = parts

  const decodeBase64Url = (str: string): string => {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    return atob(base64)
  }

  const header = JSON.parse(decodeBase64Url(headerB64))
  const payload = JSON.parse(decodeBase64Url(payloadB64))

  return {
    header,
    payload,
    signature,
    raw: {
      header: headerB64,
      payload: payloadB64,
      signature,
    },
  }
}

export async function generateHash(
  input: string,
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function generateHmac(
  message: string,
  secret: string,
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateUUID(): string {
  return crypto.randomUUID()
}

export function validateUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return regex.test(uuid)
}

export function generateNanoId(length: number = 21): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
  const randomValues = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(randomValues)
    .map((byte) => alphabet[byte % alphabet.length])
    .join('')
}

export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0')
  const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0')
  const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')
  const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0')
  return timestamp + machineId + processId + counter
}

export function parseObjectId(objectId: string): { timestamp: Date; timestampSeconds: number } {
  if (!/^[0-9a-fA-F]{24}$/.test(objectId)) {
    throw new Error('Invalid ObjectId format')
  }
  const timestampHex = objectId.slice(0, 8)
  const timestampSeconds = parseInt(timestampHex, 16)
  return {
    timestamp: new Date(timestampSeconds * 1000),
    timestampSeconds,
  }
}
