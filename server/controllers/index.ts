import { Services } from '../services'
import CasesController from './casesController'
import ProposedAddressesController from './proposedAddressesController'

export const controllers = (services: Services) => ({
  casesController: new CasesController(
    services.auditService,
    services.casesService,
    services.referralsService,
    services.eligibilityService,
    services.dutyToReferService,
    services.proposedAddressesService,
  ),
  proposedAddressesController: new ProposedAddressesController(
    services.auditService,
    services.proposedAddressesService,
    services.casesService,
  ),
})

export type Controllers = ReturnType<typeof controllers>
