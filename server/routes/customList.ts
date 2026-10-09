import { Router } from 'express'
import uiPaths from '../paths/ui'
import config from '../config'
import CustomListController from '../controllers/customListController'

export default function customListRoutes(
  router: Router,
  customListController: CustomListController,

): void {
  router.get(uiPaths.customList.createList.pattern, customListController.createList())
  router.get(uiPaths.customList.addCrns.pattern, customListController.addCrns())
  router.post(uiPaths.customList.addCrns.pattern, customListController.submitCrnList())
  router.get(uiPaths.customList.show.pattern, customListController.show())

}
