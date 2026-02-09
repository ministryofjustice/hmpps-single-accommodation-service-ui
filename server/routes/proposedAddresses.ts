import { Router } from 'express'
import type ProposedAddressesController from '../controllers/proposedAddressesController'
import uiPaths from '../paths/ui'

export default function proposedAddressesRoutes(
  router: Router,
  proposedAddressesController: ProposedAddressesController,
): void {
  router.get(uiPaths.proposedAddresses.start.pattern, proposedAddressesController.start())

  router.get(uiPaths.proposedAddresses.details.pattern, proposedAddressesController.details())
  router.post(uiPaths.proposedAddresses.details.pattern, proposedAddressesController.saveDetails())

  router.get(uiPaths.proposedAddresses.type.pattern, proposedAddressesController.type())
  router.post(uiPaths.proposedAddresses.type.pattern, proposedAddressesController.saveType())

  router.get(uiPaths.proposedAddresses.status.pattern, proposedAddressesController.status())
  router.post(uiPaths.proposedAddresses.status.pattern, proposedAddressesController.saveStatus())

  router.get(uiPaths.proposedAddresses.nextAccommodation.pattern, proposedAddressesController.nextAccommodation())
  router.post(uiPaths.proposedAddresses.nextAccommodation.pattern, proposedAddressesController.saveNextAccommodation())

  router.get(uiPaths.proposedAddresses.checkYourAnswers.pattern, proposedAddressesController.checkYourAnswers())
  router.post(uiPaths.proposedAddresses.submit.pattern, proposedAddressesController.submit())

  router.get(uiPaths.proposedAddresses.cancel.pattern, proposedAddressesController.cancel())
}
