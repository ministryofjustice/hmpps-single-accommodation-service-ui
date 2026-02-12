import { GetCasesQuery } from '@sas/ui'
import { CasesClient } from '../data'

export default class CasesService {
  constructor(private readonly casesClient: CasesClient) {}

  getCases(token: string, query: GetCasesQuery) {
    return this.casesClient.getCases(token, query)
  }

  getCase(token: string, crn: string) {
    return this.casesClient.getCase(token, crn)
  }
}
