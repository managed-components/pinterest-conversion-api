import { ComponentSettings, Manager, MCEvent } from '@managed-components/types'
import UAParser from 'ua-parser-js'
import * as crypto from 'crypto' // remove when done testing in webCM
function sha256(toHash: any) {
  return crypto.createHash('sha256').update(toHash).digest('hex')
}

export const getEventData = (
  event: MCEvent,
  pageview: boolean,
  ecomPayload?: any
) => {
  const { client } = event
  const parsedUserAgent = UAParser(client.userAgent)
  const payload = ecomPayload ? ecomPayload : event.payload

  const eventData = {
    event_name: pageview ? 'page_visit' : payload.name,
    action_source: payload.action_source || 'web',
    event_time: client.timestamp,
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
    // are we sending like this: Two-character ISO-639-1 language code indicating the user's language?
    language: payload.language || client.language.split(',')[0].substring(0, 2),
    user_properties: {
      client_ip_address: payload.client_ip_address || client.ip.toString(),
      client_user_agent: payload.client_user_agent || parsedUserAgent.ua,
      ...(payload.em &&
        typeof payload.em === 'string' && {
          em: sha256(payload.em.toLowerCase()),
        }),
      ...(payload.hashed_maids && {
        hashed_maids: sha256(payload.hashed_maids),
      }),
      ...(payload.ph && { ph: sha256(payload.ph) }),
      ...(payload.ge && { ge: sha256(payload.ge) }),
      ...(payload.bd && { ge: sha256(payload.bd) }),
      ...(payload.ln && { ge: sha256(payload.ln) }),
      ...(payload.fn && { ge: sha256(payload.fn) }),
      ...(payload.ct && { ge: sha256(payload.ct) }),
      ...(payload.st && { ge: sha256(payload.st) }),
      ...(payload.zp && { ge: sha256(payload.zp) }),
      ...(payload.country && { ge: sha256(payload.country) }),
      ...(payload.external_id && { ge: sha256(payload.external_id) }),
      ...(payload.click_id && { ge: sha256(payload.click_id) }),
    },
    custom_data: {
      ...(payload.search_string && { search_string: payload.search_string }),
      ...(payload.opt_out_type && { opt_out_type: payload.opt_out_type }),
      ...(payload.np && { np: payload.np }),
      ...(payload.currency && { currency: payload.currency }),
      ...(payload.value && { value: payload.value }),
      ...(payload.order_id && { order_id: payload.order_id }),
      ...(payload.content_ids && { content_ids: payload.content_ids }),
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
  const ecomDataMap = (event: MCEvent) => {
    const { type, name } = event
    let { payload } = event
    payload = { ...payload, ...payload.ecommerce }
    delete payload.ecommerce

    if (type === 'ecommerce') {
      const mapEventName = (name: any) => {
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
          item_price: product.price,
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

  manager.addEventListener('pageview', async event => {
    const eventData = getEventData(event, true)
    sendEvent(eventData)
  })

  manager.addEventListener('event', async event => {
    const checkEventName = () => {
      const allowedEvents = [
        'custom',
        'lead',
        'search',
        'signup',
        'view_category',
        'watch_video',
      ]
      if (allowedEvents.includes(event.payload.name)) {
        const eventData = getEventData(event, false)
        console.log('my result', eventData)
        sendEvent(eventData)
      }
    }
    checkEventName()
  })

  manager.addEventListener('ecommerce', async event => {
    const ecomPayload = ecomDataMap(event)
    const eventData = getEventData(event, false, ecomPayload)
    sendEvent(eventData)
  })

  // sendEvent function is the main functions to send a server side request
  const sendEvent = async (eventData: any) => {
    const requestBody = {
      data: [eventData],
    }

    // after testing change endpoint to: https://api.pinterest.com/v5/ad_accounts/{ad_account_id}/events
    const pinterestEndpoint = `https://en3cl2fkvcs8a.x.pipedream.net/?${settings.ad_account_id}`
    manager.fetch(pinterestEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        //not sure if Authorization was handled properly?!
        Authorization: `basic ${settings.conversion_token}`,
      },
      body: JSON.stringify(requestBody),
    })
  }
}
