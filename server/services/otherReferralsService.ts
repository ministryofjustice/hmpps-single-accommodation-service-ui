import { OtherAccommodationReferralCommand } from '@sas/api'
import { OtherReferralsClient } from '../data'

export default class OtherReferralsService {
  constructor(private readonly otherReferralsClient: OtherReferralsClient) {}

  getOtherReferralBySubmissionId(token: string, crn: string, id: string) {
    return this.otherReferralsClient.getOtherReferralBySubmissionId(token, crn, id)
  }

  submit(token: string, crn: string, data: OtherAccommodationReferralCommand) {
    return this.otherReferralsClient.submit(token, crn, data)
  }
}
