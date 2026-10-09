import { Services } from '../services'
import CasesController from './casesController'
import DutyToReferController from './dutyToReferController'
import ProposedAddressesController from './proposedAddressesController'
import CurrentAddressController from './currentAddressController'
import StaticController from './staticController'
import ExternalReferralsController from './externalReferralsController'
import CustomListController from './customListController'

export const controllers = (services: Services) => ({
  casesController: new CasesController(
    services.auditService,
    services.casesService,
    services.referralsService,
    services.eligibilityService,
    services.dutyToReferService,
    services.proposedAddressesService,
    services.accommodationService,
    services.userService,
    services.externalReferralsService,
  ),
  proposedAddressesController: new ProposedAddressesController(
    services.auditService,
    services.proposedAddressesService,
    services.casesService,
    services.osDataHubService,
    services.referenceDataService,
  ),
  currentAddressController: new CurrentAddressController(
    services.auditService,
    services.casesService,
    services.proposedAddressesService,
  ),
  dutyToReferController: new DutyToReferController(
    services.auditService,
    services.dutyToReferService,
    services.casesService,
    services.referenceDataService,
  ),
  externalReferralsController: new ExternalReferralsController(
    services.auditService,
    services.externalReferralsService,
    services.casesService,
  ),
  customListController: new CustomListController(
    services.auditService,
    services.casesService,
    services.customListService,
    services.userService,
  ),
  staticController: new StaticController(),
})

export type Controllers = ReturnType<typeof controllers>
