import { Request, RequestHandler, Response } from 'express'
import { GetCasesQuery } from '@sas/ui'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import {
  casesResultsSummary,
  casesToRows,
  caseAssignedTo,
  mapGetCasesQuery,
  casesTableColumns,
  queryToFilters,
} from '../utils/cases'
import { dutyToReferStatusCard } from '../utils/dutyToRefer'
import ReferralsService from '../services/referralsService'
import EligibilityService from '../services/eligibilityService'
import { eligibilityToEligibilityCards } from '../utils/eligibility'
import DutyToReferService from '../services/dutyToReferService'
import uiPaths from '../paths/ui'
import { addErrorToFlash } from '../utils/validation'
import ProposedAddressesService from '../services/proposedAddressesService'
import { proposedAddressStatusCard } from '../utils/proposedAddresses'
import { referralHistoryRows } from '../utils/referrals'
import { initialiseName } from '../utils/utils'
import AccommodationService from '../services/accommodationService'
import { accommodationCard, accommodationHistoryRows } from '../utils/accommodationSummary'

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
    private readonly accommodationService: AccommodationService,
  ) {}

  index(): RequestHandler {
    return async (req: IndexRequest, res: Response) => {
      const { token, userId, username, displayName } = res.locals.user
      await this.auditService.logPageView(Page.CASES_LIST, { who: username, correlationId: req.id })
      const { query } = req

      if (query.assignedTo === undefined) query.assignedTo = 'you'
      const { data: cases } = await this.casesService.getCases(token, mapGetCasesQuery(query, userId))
      const filters = queryToFilters(query, req.url)

      return res.render('pages/index', {
        resultsSummary: casesResultsSummary(cases),
        casesTableColumns: casesTableColumns(),
        casesRows: casesToRows(cases),
        query,
        filters,
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
      await this.auditService.logPageView(Page.CASE_PROFILE_TRACKER, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { crn } = req.params
      const { token } = res.locals.user

      const [
        { data: caseData },
        { data: referralHistory },
        { data: eligibility },
        { data: dutyToRefer },
        { data: proposedAddresses },
        { data: currentAccommodation },
        { data: nextAccommodation },
        { data: accommodationHistory },
      ] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.referralsService.getReferralHistory(token, crn),
        this.eligibilityService.getEligibility(token, crn),
        this.dutyToReferService.getCurrentDtr(token, crn),
        this.proposedAddressesService.getProposedAddresses(token, crn),
        this.accommodationService.getCurrentAccommodation(token, crn),
        this.accommodationService.getNextAccommodation(token, crn),
        this.accommodationService.getAccommodationHistory(token, crn),
      ])

      return res.render('pages/show', {
        caseData,
        assignedTo: caseAssignedTo(caseData, res.locals?.user?.username),
        nextActions: eligibility.caseActions,
        nextAccommodationCard: accommodationCard('next', nextAccommodation),
        currentAccommodationCard: accommodationCard('current', currentAccommodation),
        referralHistoryRows: referralHistoryRows(referralHistory),
        eligibilityCards: eligibilityToEligibilityCards(eligibility),
        dutyToReferCard: dutyToReferStatusCard(dutyToRefer),
        proposedAddresses: proposedAddresses.proposed.map(proposedAddressStatusCard),
        accommodationHistoryRows: accommodationHistoryRows(accommodationHistory),
        failedChecksAddresses: proposedAddresses.failedChecks.map(proposedAddressStatusCard),
      })
    }
  }
}
