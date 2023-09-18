import { MCEvent } from '@managed-components/types'
import { getEventData } from '.'
describe('getEventData', () => {
  it('generates a compliant request payload', async () => {
    const expectedResult = {
      event_name: 'lead',
      action_source: 'brie',
      event_id: 'mytest133r4524',
      event_source_url: undefined,
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
      user_data: {
        client_ip_address: '::1',
        client_user_agent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        click_id: '1531262624',
        em: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
        hashed_maids:
          '5e8a5ed735739e9281b7324b75bc96b37784f75cad8ab1ccffb61f87a098c06a',
        ph: 'a231e771cb4993085107fb4a6c067b850466eeccaa3c58d446ae48a5ee83b7a9',
        ge: '0d248e82c62c9386878327d491c762a002152d42ab2c391a31c44d9f62675ddf',
        bd: '01203006fa1afc3a4647e6c77c1bdf09450a65ad9be9b46523f25482c6017873',
        ln: 'bb359aed64ef3d28926979e36f6ee43a8880c44dad1f3079a8b74c0aefb2687f',
        fn: '9ae4bc0e32db0e3484cd398459d20f9b4f79cce36667428181bf037131a3c987',
        ct: '8374c43b01b9243ca119c7495391cbe6700cec66c4453b45d7790c82849bac37',
        st: 'd1121c939cdad7e34c57c1991132059e7c94ae002e61849cc83dce98d2acf6c6',
        zp: 'b281bc2c616cb3c3a097215fdc9397ae87e6e06b156cc34e656be7a1a9ce8839',
        country:
          '3e049d78d958038ac6bd5dcf038075cc73362b4956aaf7308c3a69c8eca76297',
        external_id:
          'da379b7950f9b50f9fd247a8700038393cb4dfec33cb92ca460a250135db509b',
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

    const result = await getEventData(
      mockMCEvent.client,
      false,
      mockMCEvent.payload
    )
    delete (result as Record<string, unknown>).event_time
    expect(result).toEqual(expectedResult)
  })
})
