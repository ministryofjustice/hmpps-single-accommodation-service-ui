import { Services } from '../services'
import CasesController from './casesController'

export const controllers = (services: Services) => ({
  casesController: new CasesController(
    services.auditService,
    services.casesService,
    services.referralsService,
    services.eligibilityService,
    services.dutyToReferService,
    services.proposedAddressesService,
  ),
})

export type Controllers = ReturnType<typeof controllers>
