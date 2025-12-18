import { Request, RequestHandler, Response } from 'express'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import { casesTableCaption, casesToRows, caseAssignedTo, referralHistoryToRows } from '../utils/cases'
import ReferralsService from '../services/referralsService'

export default class CasesController {
  constructor(
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
    private readonly referralsService: ReferralsService,
  ) {}

  index(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.CASES_LIST, { who: res.locals.user.username, correlationId: req.id })
      const token = res.locals?.user?.token

      const cases = await this.casesService.getCases(token)
      return res.render('pages/index', { tableCaption: casesTableCaption(cases), casesRows: casesToRows(cases) })
    }
  }

  show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      await this.auditService.logPageView(Page.CASE_PROFILE_TRACKER, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const token = res.locals?.user?.token
      const [caseData, referralHistory] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.referralsService.getReferralHistory(token, crn),
      ])

      return res.render('pages/show', {
        caseData,
        assignedTo: caseAssignedTo(caseData, res.locals?.user?.userId),
        referralHistory: referralHistoryToRows(referralHistory),
      })
    }
  }
}
