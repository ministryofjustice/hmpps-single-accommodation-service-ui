import { dataAccess } from '../data'
import AuditService from './auditService'
import CasesService from './casesService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, casesClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    casesService: new CasesService(casesClient),
  }
}

export type Services = ReturnType<typeof services>
