import { GetCasesApiQuery } from '@sas/ui'
import { Cas2ArrivalDto } from '@sas/api'
import { CasesClient } from '../data'

export default class CasesService {
  constructor(private readonly casesClient: CasesClient) {}

  getCases(token: string, query: GetCasesApiQuery) {
    return this.casesClient.getCases(token, query)
  }

  getCase(token: string, crn: string) {
    return this.casesClient.getCase(token, crn)
  }

  searchByCrn(token: string, crn: string) {
    return this.casesClient.searchByCrn(token, crn)
  }

  submitCas2Arrival(token: string, crn: string, applicationId: string, arrival: Cas2ArrivalDto) {
    return this.casesClient.submitCas2Arrival(token, crn, applicationId, arrival)
  }

  getRecentSearches(token: string) {
    return this.casesClient.getRecentSearches(token)
  }
}
