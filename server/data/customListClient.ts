import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ApiResponseDtoListCaseDto, ApiResponseDtoListString } from '@sas/api'
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
      { path: apiPaths.customList.updateList({}), data: crnList, timeout: config.timeoutOverrides.sasCasesApi },
      asUser(token),
    )
  }

  getCustomListCrns(token: string) {
    return this.get<ApiResponseDtoListString>(
      { path: apiPaths.customList.getList({}), timeout: config.timeoutOverrides.sasCasesApi },
      asUser(token),
    )
  }

  getCustomListCases(token: string, query: GetCasesQuery) {
    return this.get<ApiResponseDtoListCaseDto>(
      { path: apiPaths.customList.getCases({}), query, timeout: config.timeoutOverrides.sasCasesApi },
      asUser(token),
    )
  }
}
