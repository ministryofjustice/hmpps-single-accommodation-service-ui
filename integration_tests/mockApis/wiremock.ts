import superagent, { SuperAgentRequest, Response } from 'superagent'

const url = 'http://localhost:9091/__admin'

const stubFor = (mapping: Record<string, unknown>): SuperAgentRequest =>
  superagent.post(`${url}/mappings`).send(mapping)

const getMatchingRequests = (body: string | object) => superagent.post(`${url}/requests/find`).send(body)

const resetStubs = (): Promise<Array<Response>> =>
  Promise.all([superagent.delete(`${url}/mappings`), superagent.delete(`${url}/requests`)])

const stubApiError = (urlPattern: string, method: 'GET' | 'POST' = 'GET', status = 500): SuperAgentRequest =>
  stubFor({
    request: {
      method,
      urlPattern,
    },
    response: {
      status,
    },
  })

export { stubFor, getMatchingRequests, resetStubs, stubApiError }
