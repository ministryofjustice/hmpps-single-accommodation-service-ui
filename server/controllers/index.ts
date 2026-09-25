import { Services } from '../services'
import CasesController from './casesController'
import DutyToReferController from './dutyToReferController'
import ProposedAddressesController from './proposedAddressesController'
import StaticController from './staticController'
import OtherReferralsController from './otherReferralsController'

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
    services.otherReferralsService,
  ),
  proposedAddressesController: new ProposedAddressesController(
    services.auditService,
    services.proposedAddressesService,
    services.casesService,
    services.osDataHubService,
    services.referenceDataService,
  ),
  dutyToReferController: new DutyToReferController(
    services.auditService,
    services.dutyToReferService,
    services.casesService,
    services.referenceDataService,
  ),
  otherReferralsController: new OtherReferralsController(
    services.auditService,
    services.otherReferralsService,
    services.casesService,
  ),
  staticController: new StaticController(),
})

export type Controllers = ReturnType<typeof controllers>
