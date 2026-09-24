/* istanbul ignore file */
import { dataAccess } from '../data'
import AuditService from './auditService'
import CasesService from './casesService'
import ReferenceDataService from './referenceDataService'
import ReferralsService from './referralsService'
import EligibilityService from './eligibilityService'
import DutyToReferService from './dutyToReferService'
import ProposedAddressesService from './proposedAddressesService'
import OsDataHubService from './osDataHubService'
import AccommodationService from './accommodationService'
import UserService from './userService'
import OtherReferralsService from './otherReferralsService'

export const services = () => {
  const {
    applicationInfo,
    hmppsAuditClient,
    casesClient,
    referenceDataClient,
    referralsClient,
    eligibilityClient,
    dutyToReferClient,
    otherReferralsClient,
    proposedAddressesClient,
    osDataHubClient,
    accommodationClient,
    userClient,
  } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    casesService: new CasesService(casesClient),
    referenceDataService: new ReferenceDataService(referenceDataClient),
    referralsService: new ReferralsService(referralsClient),
    eligibilityService: new EligibilityService(eligibilityClient),
    dutyToReferService: new DutyToReferService(dutyToReferClient),
    otherReferralsService: new OtherReferralsService(otherReferralsClient),
    proposedAddressesService: new ProposedAddressesService(proposedAddressesClient),
    osDataHubService: new OsDataHubService(osDataHubClient),
    accommodationService: new AccommodationService(accommodationClient),
    userService: new UserService(userClient),
  }
}

export type Services = ReturnType<typeof services>
