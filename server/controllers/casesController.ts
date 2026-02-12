import { Request, RequestHandler, Response } from 'express'
import { GetCasesQuery } from '@sas/ui'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import {
  accommodationCard,
  casesTableCaption,
  casesToRows,
  caseAssignedTo,
  referralHistoryTable,
  mapGetCasesQuery,
} from '../utils/cases'
import { dutyToReferStatusCard } from '../utils/dutyToRefer'
import ReferralsService from '../services/referralsService'
import EligibilityService from '../services/eligibilityService'
import { eligibilityToEligibilityCards } from '../utils/eligibility'
import DutyToReferService from '../services/dutyToReferService'
import uiPaths from '../paths/ui'
import { addErrorToFlash } from '../utils/validation'
import { statusCard } from '../utils/components'
import ProposedAddressesService from '../services/proposedAddressesService'
import { proposedAddressStatusCard } from '../utils/proposedAddresses'
import { initialiseName } from '../utils/utils'

interface IndexRequest extends Request {
  query: GetCasesQuery
}

export default class CasesController {
  constructor(
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
    private readonly referralsService: ReferralsService,
    private readonly eligibilityService: EligibilityService,
    private readonly dutyToReferService: DutyToReferService,
    private readonly proposedAddressesService: ProposedAddressesService,
  ) {}

  index(): RequestHandler {
    return async (req: IndexRequest, res: Response) => {
      const { token, userId, username, displayName } = res.locals.user
      await this.auditService.logPageView(Page.CASES_LIST, { who: username, correlationId: req.id })
      const { query } = req

      const filterIsApplied = query.assignedTo !== undefined

      if (!filterIsApplied) query.assignedTo = 'you'

      const cases = await this.casesService.getCases(token, mapGetCasesQuery(query, userId))

      return res.render('pages/index', {
        tableCaption: casesTableCaption(cases, query, displayName),
        casesRows: casesToRows(cases),
        query,
        filterIsApplied,
        assignedToOptions: [
          { value: 'you', text: `You (${initialiseName(displayName)})` },
          { value: 'anyone', text: 'Anyone' },
        ],
        riskLevelOptions: [
          { value: '', text: 'All' },
          { value: 'VERY_HIGH', text: 'Very high' },
          { value: 'HIGH', text: 'High' },
          { value: 'MEDIUM', text: 'Medium' },
          { value: 'LOW', text: 'Low' },
        ],
      })
    }
  }

  search(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.query
      if (!crn) {
        addErrorToFlash(req, 'crn', 'Enter a CRN')
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
        const [caseData, referralHistory, eligibility, dutyToRefer, proposedAddresses] = await Promise.all([
          this.casesService.getCase(token, crn),
          this.referralsService.getReferralHistory(token, crn),
          this.eligibilityService.getEligibility(token, crn),
          this.dutyToReferService.getDutyToRefer(token, crn),
          this.proposedAddressesService.getProposedAddresses(token, crn),
        ])

        return res.render('pages/show', {
          caseData,
          assignedTo: caseAssignedTo(caseData, res.locals?.user?.userId),
          nextAccommodationCard: accommodationCard('next', caseData.nextAccommodation),
          currentAccommodationCard: accommodationCard('current', caseData.currentAccommodation),
          referralHistory: referralHistoryTable(referralHistory),
          eligibilityCards: eligibilityToEligibilityCards(eligibility).map(statusCard),
          dutyToReferCard: statusCard(dutyToReferStatusCard(dutyToRefer[0])),
          proposedAddresses: proposedAddresses.proposed.map(proposedAddressStatusCard).map(statusCard),
          failedChecksAddresses: proposedAddresses.failedChecks.map(proposedAddressStatusCard).map(statusCard),
        })
      } catch (error) {
        if (error.responseStatus === 404) {
          addErrorToFlash(req, 'crn', 'This CRN does not exist or cannot be shown')
          return res.redirect(`${uiPaths.cases.index({})}?crn=${encodeURIComponent(crn)}`)
        }

        throw error
      }
    }
  }
}
