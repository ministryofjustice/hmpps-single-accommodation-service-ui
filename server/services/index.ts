/* istanbul ignore file */
import { dataAccess } from '../data'
import AuditService from './auditService'
import CasesService from './casesService'
import ReferralsService from './referralsService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, casesClient, referralsClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    casesService: new CasesService(casesClient),
    referralsService: new ReferralsService(referralsClient),
  }
}

export type Services = ReturnType<typeof services>
