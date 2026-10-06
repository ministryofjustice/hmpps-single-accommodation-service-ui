import { Router } from 'express'
import uiPaths from '../paths/ui'
import ExternalReferralsController from '../controllers/externalReferralsController'

const basePath = uiPaths.externalReferrals
export default function externalReferralsRoutes(
  router: Router,
  externalReferralsController: ExternalReferralsController,
): void {
  router.get(basePath.show.pattern, externalReferralsController.show())
  router.get(basePath.submission.pattern, externalReferralsController.submission('add'))
  router.post(basePath.submission.pattern, externalReferralsController.saveSubmission('add'))
  router.get(basePath.edit.pattern, externalReferralsController.submission('edit'))
  router.post(basePath.edit.pattern, externalReferralsController.saveSubmission('edit'))

  router.post(basePath.show.pattern, externalReferralsController.saveNote())

  router.get(basePath.outcome.pattern, externalReferralsController.outcome())
  router.post(basePath.outcome.pattern, externalReferralsController.saveOutcome())
}
