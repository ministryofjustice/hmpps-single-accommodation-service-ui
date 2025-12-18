import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { CaseDto } from '@sas/api'
import { AccommodationDto } from '@sas/ui'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

// TODO: remove type overwrite once API response updated
type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U
export type Case = Overwrite<
  CaseDto,
  {
    currentAccommodation: AccommodationDto
    nextAccommodation: AccommodationDto
  }
>

export default class CasesClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Cases client', config.apis.sasApi, logger, authenticationClient)
  }

  /**
   * Example: Making an anonymous request with a system token
   *
   * Use this pattern to call the API with a system token that is not tied to a specific user.
   * This is useful for service-to-service authorization when no user context is required.
   *
   * ```
   * import { asUser } from '@ministryofjustice/hmpps-rest-client'
   * getCurrentTime() {
   *   return this.get<string>({ path: '/example/time' }, asSystem())
   * }
   * ```
   */

  /**
   * Example: Making a request with the user's own token
   *
   * Use this pattern to call the API with a user's access token.
   * This is useful when authorization depends on the user's roles and permissions.
   *
   * Example:
   * ```
   * import { asUser } from '@ministryofjustice/hmpps-rest-client'
   *
   * getCurrentTime(token: string) {
   *   return this.get({ path: '/example/time' }, asUser(token))
   * }
   * ```
   */

  /**
   * Example: Making a request with a system token for a specific user
   *
   * Use this pattern to call the API with a system token tied to a specific user.
   * This is typically used for auditing purposes to track system-initiated actions on behalf of a user.
   *
   * Example:
   * ```
   * import { asSystem } from '@ministryofjustice/hmpps-rest-client'
   *
   * getCurrentTime(username: string) {
   *   return this.get({ path: '/example/time' }, asSystem(username))
   * }
   * ```
   */

  getCases(token: string) {
    return this.get<Case[]>({ path: apiPaths.cases.index({}) }, asUser(token))
  }

  getCase(token: string, crn: string) {
    return this.get<Case>({ path: apiPaths.cases.show({ crn }) }, asUser(token))
  }
}
