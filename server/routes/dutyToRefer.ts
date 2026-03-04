import { Router } from 'express'
import type DutyToReferController from '../controllers/dutyToReferController'
import uiPaths from '../paths/ui'

export default function dutyToReferRoutes(router: Router, dutyToReferController: DutyToReferController): void {
  router.get(uiPaths.dutyToRefer.guidance.pattern, dutyToReferController.guidance())
  router.get(uiPaths.dutyToRefer.submission.pattern, dutyToReferController.submission())
  router.get(uiPaths.dutyToRefer.outcome.pattern, dutyToReferController.outcome())

  router.post(uiPaths.dutyToRefer.submit.pattern, dutyToReferController.submit())
  router.post(uiPaths.dutyToRefer.update.pattern, dutyToReferController.update())
}
