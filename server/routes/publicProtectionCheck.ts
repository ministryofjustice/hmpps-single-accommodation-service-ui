import { Router } from 'express'
import PublicProtectionCheckController from '../controllers/publicProtectionCheckController'
import uiPaths from '../paths/ui'
import { publicProtectionCheckPageNames } from '../utils/publicProtectionCheck'

export default function publicProtectionCheckRoutes(
  router: Router,
  publicProtectionCheckController: PublicProtectionCheckController,
): void {
  router.get(uiPaths.publicProtectionCheck.start.pattern, publicProtectionCheckController.start())
  router.get(uiPaths.publicProtectionCheck.checkYourAnswers.pattern, publicProtectionCheckController.checkYourAnswers())

  publicProtectionCheckPageNames.forEach(page => {
    router.get(
      uiPaths.publicProtectionCheck.root.path(page).pattern,
      publicProtectionCheckController.questionShow(page),
    )
    router.post(
      uiPaths.publicProtectionCheck.root.path(page).pattern,
      publicProtectionCheckController.questionSave(page),
    )
  })
}
