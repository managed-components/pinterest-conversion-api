import {
  Client,
  ComponentSettings,
  Manager,
  MCEvent,
} from '@managed-components/types'
import UAParser from 'ua-parser-js'
import {
  checkEventName,
  hashPayload,
  enrichEventData,
  getCustomData,
} from './utils'

export interface Product {
  product_id: number | string
  sku: number | string
  name: string
  category: string
  brand: string
  price: number | string
  quantity: number
  variant: string
  currency: string
  value: number | string
  position: number | string
}

export const getEventData = async (
  client: Client,
  pageview: boolean,
  payload: MCEvent['payload']
) => {
  const parsedUserAgent = UAParser(client.userAgent)

  const [hashedUserProperties, eventDataResult, customDataResult] =
    await Promise.all([
      hashPayload(payload),
      enrichEventData(payload),
      getCustomData(payload),
    ])

  const eventData = {
    event_name: pageview ? 'page_visit' : payload.name,
    action_source: payload.action_source || 'web',
    event_time: Math.floor(Date.now() / 1000),
    event_id:
      payload.event_id || payload.ecommerce?.event_id || crypto.randomUUID(),
    event_source_url: payload.event_source_url || client.url.href,
    opt_out: payload.opt_out || false,
    device_brand: parsedUserAgent.device.vendor,
    device_model: parsedUserAgent.device.model,
    os_version: parsedUserAgent.os.version,
    language: payload.language || client.language.split(',')[0].substring(0, 2),
    ...eventDataResult,
    user_data: {
      client_ip_address: payload.client_ip_address || client.ip.toString(),
      client_user_agent: payload.client_user_agent || parsedUserAgent.ua,
      ...(payload.click_id && { click_id: payload.click_id }),
      ...hashedUserProperties,
    },
    custom_data: {
      ...customDataResult,
    },
  }
  return eventData
}

export default async function (manager: Manager, settings: ComponentSettings) {
  const getEcommercePayload = (event: MCEvent) => {
    const { name } = event
    let { payload } = event
    payload = { ...payload, ...payload.ecommerce }
    payload.name =
      name === 'Product Added'
        ? 'add_to_cart'
        : name === 'Order Completed'
        ? 'checkout'
        : name
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
          } else if (typeof product.quantity === 'number') {
            return sum + product.quantity
          }
          return sum
        }, 0)
    }

    payload.value = payload.revenue || payload.total || payload.value
    return payload
  }

  const sendEvent = async (eventData: Record<string, unknown>) => {
    const requestBody = {
      data: [eventData],
    }

    const pinterestEndpoint = `https://api.pinterest.com/v5/ad_accounts/${settings.ad_account_id}/events`

    await manager.fetch(pinterestEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.conversion_token}`,
      },
      body: JSON.stringify(requestBody),
    })
  }

  manager.addEventListener('pageview', async event => {
    const eventData = await getEventData(event.client, true, event.payload)
    sendEvent(eventData)
  })

  manager.addEventListener('event', async event => {
    const checkedEvent = checkEventName(event)
    if (!checkedEvent) {
      // If the event isn't allowed, we stop processing
      return
    }
    const eventData = await getEventData(event.client, false, event.payload)
    if (eventData) {
      sendEvent(eventData)
    }
  })

  manager.addEventListener('ecommerce', async event => {
    const ecomPayload = getEcommercePayload(event)
    const eventData = await getEventData(event.client, false, ecomPayload)
    sendEvent(eventData)
  })
}
