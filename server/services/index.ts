import { dataAccess } from '../data'
import AuditService from './auditService'
import ExampleService from './exampleService'
import CasesService from './casesService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, sasClient, casesClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    exampleService: new ExampleService(sasClient),
    casesService: new CasesService(casesClient),
  }
}

export type Services = ReturnType<typeof services>
