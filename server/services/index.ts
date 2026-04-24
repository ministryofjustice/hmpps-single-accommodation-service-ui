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
import AccommodationsService from './accommodationsService'

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
    accommodationsClient,
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
    accommodationsService: new AccommodationsService(accommodationsClient),
  }
}

export type Services = ReturnType<typeof services>
