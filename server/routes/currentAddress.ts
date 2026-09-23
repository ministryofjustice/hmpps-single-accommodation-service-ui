import { Router } from 'express'
import type CurrentAddressController from '../controllers/currentAddressController'
import uiPaths from '../paths/ui'

export default function currentAddressRoutes(router: Router, currentAddressController: CurrentAddressController): void {
  router.get(uiPaths.currentAddress.select.pattern, currentAddressController.select())
  router.post(uiPaths.currentAddress.select.pattern, currentAddressController.saveSelect())

  router.get(uiPaths.currentAddress.new.pattern, currentAddressController.addNew())
}
