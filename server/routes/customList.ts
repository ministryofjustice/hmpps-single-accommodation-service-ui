import { Router } from 'express'
import uiPaths from '../paths/ui'
import CustomListController from '../controllers/customListController'
import CasesController from '../controllers/casesController'

export default function customListRoutes(router: Router, customListController: CustomListController, casesController: CasesController): void {
  router.get(uiPaths.customList.index.pattern, customListController.index())
  router.get(uiPaths.customList.addCrns.pattern, customListController.addCrns())
  router.post(uiPaths.customList.addCrns.pattern, customListController.submitCrnList())
  router.get(uiPaths.customList.confirmation.pattern, customListController.confirmation())
  router.get(uiPaths.customList.show.pattern, casesController.show())
}
