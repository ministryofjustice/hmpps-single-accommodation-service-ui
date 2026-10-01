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
  router.get(basePath.edit.pattern, externalReferralsController.submission('edit'))
  router.post(basePath.submission.pattern, externalReferralsController.saveSubmission('add'))
  router.post(basePath.edit.pattern, externalReferralsController.saveSubmission('edit'))
}
