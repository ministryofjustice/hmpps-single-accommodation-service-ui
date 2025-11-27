import { Request, RequestHandler, Response } from 'express'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import { casesTableCaption, casesToRows } from '../utils/cases'

export default class CasesController {
  constructor(
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
  ) {}

  index(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.CASES_LIST, { who: res.locals.user.username, correlationId: req.id })
      const token = res.locals?.user?.token

      const cases = await this.casesService.getCases(token)
      return res.render('pages/index', { tableCaption: casesTableCaption(cases), casesRows: casesToRows(cases) })
    }
  }
}
