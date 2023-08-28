import { MCEvent } from '@managed-components/types'
import { getEventData } from '.'
describe('getEventData', () => {
  it('generates a compliant request payload', () => {
    const expectedResult = {
      event_name: 'lead',
      action_source: 'brie',
      event_time: 1692890759111,
      event_id: 'mytest133r4524',
      event_source_url: 'http://localhost:1337/',
      opt_out: true,
      partner_name: 'Me',
      app_id: 'wow1234',
      app_name: 'terrificapp!',
      app_version: 'my version 1234',
      device_brand: 'Apple',
      device_model: 'Macintosh',
      os_version: '10.15.7',
      wifi: true,
      language: 'en',
      user_properties: {
        client_ip_address: '::1',
        client_user_agent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        em: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
        hashed_maids:
          '5e8a5ed735739e9281b7324b75bc96b37784f75cad8ab1ccffb61f87a098c06a',
        ph: 'a231e771cb4993085107fb4a6c067b850466eeccaa3c58d446ae48a5ee83b7a9',
        ge: '5856e02f6fd0853c17f99778b1663b833e0aaac36f4ab09de76e5518db518a1e',
      },
      custom_data: {
        search_string: 'string',
        opt_out_type: 'marketing',
        np: 'somethings',
      },
    }
    const mockMCEvent = {
      payload: {
        name: 'lead',
        action_source: 'brie',
        event_id: 'mytest133r4524',
        opt_out: true,
        partner_name: 'Me',
        app_id: 'wow1234',
        app_name: 'terrificapp!',
        app_version: 'my version 1234',
        wifi: true,
        em: 'test@test.com',
        hashed_maids: 'ga.1.2.3.4.5.6.7.',
        ph: '05498715647',
        ge: 'male',
        bd: '23/3/12',
        ln: 'Hanni',
        fn: 'Chris',
        ct: 'Capetown',
        st: 'onestreet',
        zp: '1002',
        country: 'South Africa',
        external_id: '12413512515',
        click_id: '1531262624',
        search_string: 'string',
        opt_out_type: 'marketing',
        np: 'somethings',
      },
      client: {
        emitter: 'browser',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        language: 'en-GB,en-US;q=0.9,en;q=0.8',
        referer: '',
        ip: '::1',
        title: 'Yair Dovrat',
        timestamp: 1692890759111,
        url: 'http://localhost:1337/',
      },
      type: 'event',
    } as unknown as MCEvent

    const result = getEventData(mockMCEvent, false)

    expect(result).toEqual(expectedResult)
  })
})~
