import { CasesClient } from '../data'

export default class CasesService {
  constructor(private readonly casesClient: CasesClient) {}

  getCases(token: string) {
    return this.casesClient.getCases(token)
  }
}
