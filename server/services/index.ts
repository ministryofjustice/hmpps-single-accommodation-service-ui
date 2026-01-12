/* istanbul ignore file */
import { dataAccess } from '../data'
import AuditService from './auditService'
import CasesService from './casesService'
import ReferralsService from './referralsService'
import EligibilityService from './eligibilityService'
import DutyToReferService from './dutyToReferService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, casesClient, referralsClient, eligibilityClient, dutyToReferClient } =
    dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    casesService: new CasesService(casesClient),
    referralsService: new ReferralsService(referralsClient),
    eligibilityService: new EligibilityService(eligibilityClient),
    dutyToReferService: new DutyToReferService(dutyToReferClient),
  }
}

export type Services = ReturnType<typeof services>
