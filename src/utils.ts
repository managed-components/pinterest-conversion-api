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
  payload: any
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
    if (payload[field]) {
      const hashedValue = await sha256(payload[field].toLowerCase())
      if (hashedValue) {
        hashedData[field] = [hashedValue]
      }
    }
  }
  return hashedData
}

export async function pushEventData(payload: any) {
  const eventDataKeys = [
    'partner_name',
    'app_id',
    'app_name',
    'app_version',
    'wifi',
  ]
  const eventDataResult: { [key: string]: any } = {}

  for (const key of eventDataKeys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      eventDataResult[key] = payload[key]
    }
  }
  return eventDataResult
}

export async function pushCustomData(payload: any) {
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
  const customDataResult: { [key: string]: any } = {}
  for (const key of customDataKeys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      switch (key) {
        case 'currency':
        case 'value':
          customDataResult[key] = String(payload[key])
          break
        case 'num_items':
          customDataResult[key] = parseInt(payload[key], 10) // Convert to integer
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
  if (type === 'ecommerce') {
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
        .map((product: any) => product.product_id)
        .join()
      payload.content_name = payload.products
        .map((product: any) => product.name)
        .join()
      payload.content_category = payload.products
        .map((product: any) => product.category)
        .join()
      payload.content_brand = payload.products
        .map((product: any) => product.brand)
        .join()
      payload.contents = payload.products.map((product: any) => ({
        id: product.product_id,
        item_price: product.price.toString(),
        quantity: product.quantity,
      }))
      payload.num_items =
        payload.quantity ||
        payload.products.reduce(
          (sum: any, product: any) => sum + parseInt(product.quantity, 10),
          0
        )
    }

    payload.value = payload.revenue || payload.total || payload.value
  }
  return payload
}
