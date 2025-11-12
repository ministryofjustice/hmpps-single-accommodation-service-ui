import { dataAccess } from '../data'
import AuditService from './auditService'
import ExampleService from './exampleService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, sasClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    exampleService: new ExampleService(sasClient),
  }
}

export type Services = ReturnType<typeof services>
