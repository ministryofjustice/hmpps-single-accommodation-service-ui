import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { getRequestContext } from '../utils/requestContext'

export const USER_PROBATION_REGION_HEADER = 'x-user-probation-region'

type AuthOptions = Parameters<RestClient['get']>[1]
type GetRequest<R, E> = Parameters<typeof RestClient.prototype.get<R, E>>[0]
type BodyRequest<R, E> = Parameters<typeof RestClient.prototype.post<R, E>>[0]
type DeleteRequest<R, E> = Parameters<typeof RestClient.prototype.delete<R, E>>[0]

/**
 * Base client for the SAS API. Adds context headers for the current user's request (e.g. their probation region)
 * to every outgoing request.
 */
export default abstract class SasApiClient extends RestClient {
  protected constructor(name: string, authenticationClient: ConstructorParameters<typeof RestClient>[3]) {
    super(name, config.apis.sasApi, logger, authenticationClient)
  }

  override get<Response = unknown, ErrorData = unknown>(
    request: GetRequest<Response, ErrorData>,
    authOptions?: AuthOptions,
  ): Promise<Response> {
    return super.get<Response, ErrorData>(this.withContextHeaders(request), authOptions)
  }

  override post<Response = unknown, ErrorData = unknown>(
    request: BodyRequest<Response, ErrorData>,
    authOptions?: AuthOptions,
  ): Promise<Response> {
    return super.post<Response, ErrorData>(this.withContextHeaders(request), authOptions)
  }

  override put<Response = unknown, ErrorData = unknown>(
    request: BodyRequest<Response, ErrorData>,
    authOptions?: AuthOptions,
  ): Promise<Response> {
    return super.put<Response, ErrorData>(this.withContextHeaders(request), authOptions)
  }

  override patch<Response = unknown, ErrorData = unknown>(
    request: BodyRequest<Response, ErrorData>,
    authOptions?: AuthOptions,
  ): Promise<Response> {
    return super.patch<Response, ErrorData>(this.withContextHeaders(request), authOptions)
  }

  override delete<Response = unknown, ErrorData = unknown>(
    request: DeleteRequest<Response, ErrorData>,
    authOptions?: AuthOptions,
  ): Promise<Response> {
    return super.delete<Response, ErrorData>(this.withContextHeaders(request), authOptions)
  }

  override stream<ErrorData = unknown>(request: Parameters<RestClient['stream']>[0], authOptions?: AuthOptions) {
    return super.stream<ErrorData>(this.withContextHeaders(request), authOptions)
  }

  private withContextHeaders<T extends { headers?: Record<string, string> }>(request: T): T {
    const probationRegion = getRequestContext()?.probationRegion

    if (!probationRegion) return request

    return { ...request, headers: { ...request.headers, [USER_PROBATION_REGION_HEADER]: probationRegion } }
  }
}
