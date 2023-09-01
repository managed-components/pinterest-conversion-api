import { MCEvent } from '@managed-components/types'

export const checkEventName = (event: MCEvent) => {
  const allowedEvents = [
    'custom',
    'lead',
    'search',
    'signup',
    'view_category',
    'watch_video',
  ]
  if (allowedEvents.includes(event.payload.name)) {
    return event
  } else {
    return
  }
}
export async function sha256(data: any): Promise<string | undefined> {
  if (!data) {
    return
  } else {
    const encoder = new TextEncoder()
    const dataUint8Array = encoder.encode(data)
    const digestArrayBuffer = await crypto.subtle.digest(
      'SHA-256',
      dataUint8Array
    )
    const digestUint8Array = new Uint8Array(digestArrayBuffer)
    const digestString = Array.from(digestUint8Array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
    return digestString
  }
}

export async function hashPayload(
  event: MCEvent
): Promise<Record<string, string[]>> {
  const hashedData: Record<string, string[]> = {}
  const fieldsToHash = [
    'em',
    'hashed_maids',
    'ph',
    'ge',
    'bd',
    'ln',
    'fn',
    'ct',
    'st',
    'zp',
    'country',
    'external_id',
  ]

  for (const field of fieldsToHash) {
    if (event.payload[field]) {
      const hashedValue = await sha256(event.payload[field].toLowerCase())
      if (hashedValue) {
        hashedData[field] = [hashedValue]
      }
    }
  }
  return hashedData
}
