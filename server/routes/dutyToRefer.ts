import { Router } from 'express'
import type DutyToReferController from '../controllers/dutyToReferController'
import uiPaths from '../paths/ui'

export default function dutyToReferRoutes(router: Router, dutyToReferController: DutyToReferController): void {
  router.get(uiPaths.dutyToRefer.show.pattern, dutyToReferController.show())
  router.post(uiPaths.dutyToRefer.show.pattern, dutyToReferController.saveNote())

  router.get(uiPaths.dutyToRefer.submission.pattern, dutyToReferController.submission('add'))
  router.get(uiPaths.dutyToRefer.newSubmission.pattern, dutyToReferController.submission('addNew'))
  router.get(uiPaths.dutyToRefer.edit.pattern, dutyToReferController.submission('edit'))
  router.post(uiPaths.dutyToRefer.submission.pattern, dutyToReferController.saveSubmission('add'))
  router.post(uiPaths.dutyToRefer.newSubmission.pattern, dutyToReferController.saveSubmission('addNew'))
  router.post(uiPaths.dutyToRefer.edit.pattern, dutyToReferController.saveSubmission('edit'))

  router.get(uiPaths.dutyToRefer.outcome.pattern, dutyToReferController.outcome())
  router.post(uiPaths.dutyToRefer.outcome.pattern, dutyToReferController.saveOutcome())

  router.get(uiPaths.dutyToRefer.withdraw.pattern, dutyToReferController.withdraw())
  router.post(uiPaths.dutyToRefer.withdraw.pattern, dutyToReferController.saveWithdrawal())
}
