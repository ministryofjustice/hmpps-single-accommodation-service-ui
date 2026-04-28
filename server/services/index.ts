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

export const services = () => {
  const {
    applicationInfo,
    hmppsAuditClient,
    casesClient,
    referenceDataClient,
    referralsClient,
    eligibilityClient,
    dutyToReferClient,
    proposedAddressesClient,
    osDataHubClient,
    accommodationClient,
  } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    casesService: new CasesService(casesClient),
    referenceDataService: new ReferenceDataService(referenceDataClient),
    referralsService: new ReferralsService(referralsClient),
    eligibilityService: new EligibilityService(eligibilityClient),
    dutyToReferService: new DutyToReferService(dutyToReferClient),
    proposedAddressesService: new ProposedAddressesService(proposedAddressesClient),
    osDataHubService: new OsDataHubService(osDataHubClient),
    accommodationService: new AccommodationService(accommodationClient),
  }
}

export type Services = ReturnType<typeof services>
