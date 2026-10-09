import { ExternalReferralCommand } from '@sas/api'
import { ExternalReferralsClient } from '../data'

export default class ExternalReferralsService {
  constructor(private readonly externalReferralsClient: ExternalReferralsClient) {}

  getExternalReferralBySubmissionId(token: string, crn: string, id: string) {
    return this.externalReferralsClient.getExternalReferralBySubmissionId(token, crn, id)
  }

  submit(token: string, crn: string, data: ExternalReferralCommand) {
    return this.externalReferralsClient.submit(token, crn, data)
  }

  update(token: string, crn: string, id: string, data: ExternalReferralCommand) {
    return this.externalReferralsClient.update(token, crn, id, data)
  }

  search(token: string, crn: string) {
    return this.externalReferralsClient.search(token, crn)
  }

  async getTimeline(token: string, crn: string, id: string) {
    return this.externalReferralsClient.getTimeline(token, crn, id)
  }
}
