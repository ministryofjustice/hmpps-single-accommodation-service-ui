import { Services } from '../services'
import CasesController from './casesController'
import PrivateAddressController from './privateAddressController'

export const controllers = (services: Services) => ({
  casesController: new CasesController(
    services.auditService,
    services.casesService,
    services.referralsService,
    services.eligibilityService,
    services.dutyToReferService,
    services.proposedAddressesService,
  ),
  privateAddressController: new PrivateAddressController(services.auditService, services.privateAddressService),
})

export type Controllers = ReturnType<typeof controllers>
