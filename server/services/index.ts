/* istanbul ignore file */
import { dataAccess } from '../data'
import AuditService from './auditService'
import CasesService from './casesService'
import ReferralsService from './referralsService'
import EligibilityService from './eligibilityService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, casesClient, referralsClient, eligibilityClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    casesService: new CasesService(casesClient),
    referralsService: new ReferralsService(referralsClient),
    eligibilityService: new EligibilityService(eligibilityClient),
  }
}

export type Services = ReturnType<typeof services>
