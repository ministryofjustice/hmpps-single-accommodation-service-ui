import superagent, { Response, SuperAgentRequest } from 'superagent'
import { ParsedUrlQuery } from 'node:querystring'

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

const verifyPost = async (path: string): Promise<Record<string, unknown>> => {
  const response: Response = await getMatchingRequests({
    method: 'POST',
    urlPath: path,
  })

  const { requests } = response.body
  const mostRecentRequest = requests[requests.length - 1]
  return JSON.parse(mostRecentRequest.body)
}

const queryParameters = (query?: ParsedUrlQuery) =>
  query ? Object.fromEntries(Object.entries(query).map(([key, value]) => [key, { equalTo: value }])) : undefined

export { stubFor, getMatchingRequests, resetStubs, stubApiError, verifyPost, queryParameters }
