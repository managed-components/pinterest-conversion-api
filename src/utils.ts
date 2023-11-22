import { MCEvent } from '@managed-components/types'
import { Product } from './index'

const allowedEvents = [
  'custom',
  'lead',
  'search',
  'signup',
  'view_category',
  'watch_video',
]

export function isEventAllowed(event: MCEvent): boolean {
  if (allowedEvents.includes(event.payload.name)) {
    return true
  } else {
    return false
  }
}

export async function sha256(data: string): Promise<string | null> {
  if (!data) {
    return null
  }
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

export async function hashPayload(
  payload: MCEvent['payload']
): Promise<Record<string, unknown>> {
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

  const results: Record<string, unknown> = {}
  const promises: Promise<void>[] = []

  for (const key in payload) {
    if (fieldsToHash.includes(key)) {
      const hashPromise = sha256(payload[key].toString()).then(hash => {
        results[key] = hash
      })
      promises.push(hashPromise)
    }
  }

  await Promise.all(promises)
  return results
}

export async function getRemainingEventData(payload: MCEvent['payload']) {
  if (!payload) {
    return null
  }

  const eventDataKeys = [
    'partner_name',
    'app_id',
    'app_name',
    'app_version',
    'wifi',
  ]
  const remainingEventData: { [key: string]: unknown } = {}

  for (const key of eventDataKeys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      remainingEventData[key] = payload[key]
    }
  }
  return remainingEventData
}

export async function getCustomData(payload: MCEvent['payload']) {
  if (!payload) {
    return null
  }
  const customDataKeys = [
    'search_string',
    'opt_out_type',
    'np',
    'currency',
    'value',
    'order_id',
    'content_ids',
    'content_name',
    'content_category',
    'content_brand',
    'contents',
    'num_items',
  ]
  const customDataResult: { [key: string]: unknown } = {}
  for (const key of customDataKeys) {
    const value = payload[key]
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      switch (key) {
        case 'currency':
        case 'value':
          customDataResult[key] = String(value)
          break
        case 'num_items':
          if (typeof value === 'string') {
            customDataResult[key] = parseInt(value, 10)
          } else {
            customDataResult[key] = payload[key]
          }
          break
        case 'content_ids':
          customDataResult[key] = [payload[key]]
          break
        case 'contents':
          // Ensure contents is an array of objects
          customDataResult[key] = Array.isArray(payload[key])
            ? payload[key]
            : []
          break
        default:
          customDataResult[key] = payload[key]
      }
    }
  }

  return customDataResult
}

export async function getEcommercePayload(event: MCEvent) {
  const { type, name } = event
  let { payload } = event
  payload = { ...payload, ...payload.ecommerce }
  if (type !== 'ecommerce') {
    return null
  }
  const mapEventName = (name: string | undefined) => {
    if (name === 'Product Added') {
      // Fixed the assignment (=) to comparison (===)
      return 'add_to_cart'
    } else if (name === 'Order Completed') {
      return 'checkout'
    }
  }

  payload.name = mapEventName(name)
  if (Array.isArray(payload.products)) {
    payload.content_ids = payload.products
      .map((product: Product) => product.product_id)
      .join()
    payload.content_name = payload.products
      .map((product: Product) => product.name)
      .join()
    payload.content_category = payload.products
      .map((product: Product) => product.category)
      .join()
    payload.content_brand = payload.products
      .map((product: Product) => product.brand)
      .join()
    payload.contents = payload.products.map((product: Product) => ({
      id: product.product_id,
      item_price: product.price.toString(),
      quantity: product.quantity,
    }))
    payload.num_items =
      payload.quantity ||
      payload.products.reduce((sum: number, product: Product) => {
        if (typeof product.quantity === 'string') {
          return sum + parseInt(product.quantity, 10)
        } else {
          return sum + product.quantity
        }
      }, 0)
  }

  payload.value = payload.revenue || payload.total || payload.value
  return payload
}
