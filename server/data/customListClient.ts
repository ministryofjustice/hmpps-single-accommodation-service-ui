import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ApiResponseDtoListCaseDto } from '@sas/api'
import { GetCasesQuery } from '@sas/ui'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class CustomListClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Custom list client', config.apis.sasApi, logger, authenticationClient)
  }

  addCustomList(token: string, crnList: string[]) {
    return this.post<void>(
      { path: apiPaths.customList({}), data: crnList, timeout: config.timeoutOverrides.sasCasesApi },
      asUser(token),
    )
  }

  getCustomList(token: string, query: GetCasesQuery) {
    return this.get<ApiResponseDtoListCaseDto>(
      { path: apiPaths.customList({}), query, timeout: config.timeoutOverrides.sasCasesApi },
      asUser(token),
    )
  }
}
