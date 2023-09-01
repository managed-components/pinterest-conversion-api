import { ComponentSettings, Manager, MCEvent } from '@managed-components/types'
import UAParser from 'ua-parser-js'
import { checkEventName, hashPayload } from './utils'

export const getEventData = async (
  event: MCEvent,
  pageview: boolean,
  ecomPayload?: any
) => {
  const { client } = event
  const parsedUserAgent = UAParser(client.userAgent)
  const payload = ecomPayload ? ecomPayload : event.payload
  const hashedUserProperties = await hashPayload(event)

  const eventData = {
    event_name: pageview ? 'page_visit' : payload.name,
    action_source: payload.action_source || 'web',
    event_time: Math.floor(Date.now() / 1000),
    event_id:
      payload.event_id ||
      payload.ecommerce?.event_id ||
      String(Math.round(Math.random() * 100000000000000000)),
    event_source_url: payload.event_source_url || client.url,
    opt_out: payload.opt_out || false,
    ...(payload.partner_name && { partner_name: payload.partner_name }),
    ...(payload.app_id && { app_id: payload.app_id }),
    ...(payload.app_name && { app_name: payload.app_name }),
    ...(payload.app_version && { app_version: payload.app_version }),
    device_brand: parsedUserAgent.device.vendor,
    device_model: parsedUserAgent.device.model,
    os_version: parsedUserAgent.os.version,
    ...(payload.wifi && { wifi: payload.wifi }),
    language: payload.language || client.language.split(',')[0].substring(0, 2),
    user_data: {
      client_ip_address: payload.client_ip_address || client.ip.toString(),
      client_user_agent: payload.client_user_agent || parsedUserAgent.ua,
      ...(payload.click_id && { click_id: payload.click_id }),
      ...hashedUserProperties,
    },
    custom_data: {
      ...(payload.search_string && { search_string: payload.search_string }),
      ...(payload.opt_out_type && { opt_out_type: payload.opt_out_type }),
      ...(payload.np && { np: payload.np }),
      ...(payload.currency && { currency: payload.currency }),
      ...(payload.value && { value: payload.value.toString() }),
      ...(payload.order_id && { order_id: payload.order_id }),
      ...(payload.content_ids && { content_ids: [payload.content_ids] }),
      ...(payload.content_name && { content_name: payload.content_name }),
      ...(payload.content_category && {
        content_category: payload.content_category,
      }),
      ...(payload.content_brand && { content_brand: payload.content_brand }),
      ...(payload.contents && { contents: payload.contents }),
      ...(payload.num_items && { num_items: payload.num_items }),
    },
  }
  return eventData
}

export default async function (manager: Manager, settings: ComponentSettings) {
  const getEcommercePayload = (event: MCEvent) => {
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

  // sendEvent function is the main functions to send a server side request
  const sendEvent = async (eventData: any) => {
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
    const eventData = await getEventData(event, true)
    sendEvent(eventData)
  })

  manager.addEventListener('event', async event => {
    const checkedEvent = checkEventName(event)
    if (!checkedEvent) {
      // If the event isn't allowed, we stop processing
      return
    }
    const eventData = await getEventData(event, false)
    if (eventData) {
      sendEvent(eventData)
    }
  })

  manager.addEventListener('ecommerce', async event => {
    const ecomPayload = getEcommercePayload(event)
    const eventData = await getEventData(event, false, ecomPayload)
    sendEvent(eventData)
  })
}
