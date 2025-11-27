import { Services } from '../services'
import CasesController from './casesController'

export const controllers = (services: Services) => ({
  casesController: new CasesController(services.auditService, services.casesService),
})

export type Controllers = ReturnType<typeof controllers>
