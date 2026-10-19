import nock from 'nock'
import { asUser } from '@ministryofjustice/hmpps-rest-client'
import SasApiClient, { USER_PROBATION_REGION_HEADER } from './sasApiClient'
import config from '../config'
import { runWithRequestContext } from '../utils/requestContext'

class TestClient extends SasApiClient {
  constructor() {
    super('Test client', null)
  }

  getSomething() {
    return this.get({ path: '/something', headers: { 'x-other': 'other' } }, asUser('token'))
  }

  postSomething() {
    return this.post({ path: '/something', data: { foo: 'bar' } }, asUser('token'))
  }

  putSomething() {
    return this.put({ path: '/something' }, asUser('token'))
  }

  patchSomething() {
    return this.patch({ path: '/something' }, asUser('token'))
  }

  deleteSomething() {
    return this.delete({ path: '/something' }, asUser('token'))
  }
}

describe('SasApiClient', () => {
  const client = new TestClient()

  afterEach(() => {
    nock.cleanAll()
  })

  it.each([
    ['get', () => client.getSomething()],
    ['post', () => client.postSomething()],
    ['put', () => client.putSomething()],
    ['patch', () => client.patchSomething()],
    ['delete', () => client.deleteSomething()],
  ] as const)('adds the probation region header to %s requests when available', async (method, call) => {
    nock(config.apis.sasApi.url)
      .intercept('/something', method.toUpperCase())
      .matchHeader(USER_PROBATION_REGION_HEADER, 'N07')
      .reply(200, { ok: true })

    const result = await runWithRequestContext({ probationRegion: 'N07' }, call)

    expect(result).toEqual({ ok: true })
    expect(nock.isDone()).toBe(true)
  })

  it('preserves any other headers', async () => {
    nock(config.apis.sasApi.url)
      .get('/something')
      .matchHeader(USER_PROBATION_REGION_HEADER, 'N07')
      .matchHeader('x-other', 'other')
      .reply(200, { ok: true })

    await runWithRequestContext({ probationRegion: 'N07' }, () => client.getSomething())

    expect(nock.isDone()).toBe(true)
  })

  it('does not add the header when no probation region is available', async () => {
    nock(config.apis.sasApi.url, { badheaders: [USER_PROBATION_REGION_HEADER] })
      .get('/something')
      .twice()
      .reply(200, { ok: true })

    await client.getSomething()
    await runWithRequestContext({}, () => client.getSomething())

    expect(nock.isDone()).toBe(true)
  })

  it('only sends the region for the request context the call was made in', async () => {
    nock(config.apis.sasApi.url)
      .get('/something')
      .matchHeader(USER_PROBATION_REGION_HEADER, 'N07')
      .delay(50)
      .reply(200, { region: 'N07' })
    nock(config.apis.sasApi.url)
      .get('/something')
      .matchHeader(USER_PROBATION_REGION_HEADER, 'N03')
      .reply(200, { region: 'N03' })

    const results = await Promise.all([
      runWithRequestContext({ probationRegion: 'N07' }, () => client.getSomething()),
      runWithRequestContext({ probationRegion: 'N03' }, () => client.getSomething()),
    ])

    expect(results).toEqual([{ region: 'N07' }, { region: 'N03' }])
  })
})
