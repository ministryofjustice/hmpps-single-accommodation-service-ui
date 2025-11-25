import { Router } from 'express'

import type { Services } from '../services'
import { Page } from '../services/auditService'
import { casesTableCaption, casesToRows } from '../utils/cases'

export default function routes({ auditService, casesService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res, next) => {
    await auditService.logPageView(Page.CASES_LIST, { who: res.locals.user.username, correlationId: req.id })
    const token = res.locals?.user?.token

    const { cases } = await casesService.getCases(token)
    return res.render('pages/index', { tableCaption: casesTableCaption(cases), casesRows: casesToRows(cases) })
  })

  return router
}
