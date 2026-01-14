import { Request, RequestHandler, Response } from 'express'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import { accommodationCard, casesTableCaption, casesToRows, caseAssignedTo, referralHistoryTable } from '../utils/cases'
import { dutyToReferToCard } from '../utils/dutyToRefer'
import ReferralsService from '../services/referralsService'
import EligibilityService from '../services/eligibilityService'
import { eligibilityToEligibilityCards } from '../utils/eligibility'
import DutyToReferService from '../services/dutyToReferService'
import uiPaths from '../paths/ui'
import { fetchErrors } from '../utils/validation'

export default class CasesController {
  constructor(
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
    private readonly referralsService: ReferralsService,
    private readonly eligibilityService: EligibilityService,
    private readonly dutyToReferService: DutyToReferService,
  ) {}

  index(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.CASES_LIST, { who: res.locals.user.username, correlationId: req.id })
      const token = res.locals?.user?.token
      const { errors, errorSummary } = fetchErrors(req)

      const cases = await this.casesService.getCases(token)
      return res.render('pages/index', {
        tableCaption: casesTableCaption(cases),
        casesRows: casesToRows(cases),
        params: req.query,
        errors,
        errorSummary,
      })
    }
  }

  search(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.query
      if (!crn) {
        req.flash('errors', JSON.stringify({ crnSearch: { text: 'Enter a CRN' } }))
        req.flash('errorSummary', JSON.stringify([{ text: 'Enter a CRN', href: '#crn' }]))
        return res.redirect(uiPaths.cases.index({}))
      }
      return res.redirect(uiPaths.cases.show({ crn: crn as string }))
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
      try {
        const [caseData, referralHistory, eligibility, dutyToRefer] = await Promise.all([
          this.casesService.getCase(token, crn),
          this.referralsService.getReferralHistory(token, crn),
          this.eligibilityService.getEligibility(token, crn),
          this.dutyToReferService.getDutyToRefer(token, crn),
        ])

        return res.render('pages/show', {
          caseData,
          assignedTo: caseAssignedTo(caseData, res.locals?.user?.userId),
          nextAccommodationCard: accommodationCard('next', caseData.nextAccommodation),
          currentAccommodationCard: accommodationCard('current', caseData.currentAccommodation),
          referralHistory: referralHistoryTable(referralHistory),
          eligibilityCards: eligibilityToEligibilityCards(eligibility),
          dutyToReferCard: dutyToReferToCard(dutyToRefer[0]),
        })
      } catch (error) {
        if (error.responseStatus === 404) {
          req.flash('errors', JSON.stringify({ crnSearch: { text: 'This CRN does not exist or cannot be shown' } }))
          req.flash(
            'errorSummary',
            JSON.stringify([{ text: 'This CRN does not exist or cannot be shown', href: '#crn' }]),
          )
          return res.redirect(`${uiPaths.cases.index({})}?crn=${encodeURIComponent(crn)}`)
        }

        throw error
      }
    }
  }
}
