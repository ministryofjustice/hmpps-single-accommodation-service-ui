import { Router } from 'express'
import uiPaths from '../paths/ui'
import OtherReferralsController from '../controllers/otherReferralsController'

const basePath = uiPaths.otherReferrals
export default function otherReferralsRoutes(router: Router, otherReferralsController: OtherReferralsController): void {
  router.get(basePath.show.pattern, otherReferralsController.show())
  router.get(basePath.submission.pattern, otherReferralsController.submission('add'))
  router.get(basePath.edit.pattern, otherReferralsController.submission('edit'))
  router.post(basePath.submission.pattern, otherReferralsController.saveSubmission('add'))
  router.post(basePath.edit.pattern, otherReferralsController.saveSubmission('edit'))
}
