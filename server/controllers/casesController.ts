import { Request, RequestHandler, Response } from 'express'
import { IndexRequest } from '@sas/ui'
import { CaseDto } from '@sas/api'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import {
  casesResultsSummary,
  casesToRows,
  caseToRows,
  caseAssignedTo,
  casesTableColumns,
  queryToFilters,
  displayName,
  assignedToOptions,
  casesTabs,
  validateSearchCrn,
  searchResultsSummary,
} from '../utils/cases'
import ReferralsService from '../services/referralsService'
import EligibilityService from '../services/eligibilityService'
import { eligibilityToEligibilityCards } from '../utils/eligibility'
import DutyToReferService from '../services/dutyToReferService'
import { fetchErrorsAndUserInput } from '../utils/validation'
import ProposedAddressesService from '../services/proposedAddressesService'
import { proposedAddressStatusCard } from '../utils/proposedAddresses'
import { referralHistoryRows } from '../utils/referrals'
import AccommodationService from '../services/accommodationService'
import { accommodationCard, accommodationHistoryRows, noFixedAbodeAlert } from '../utils/accommodationSummary'
import { collectApiResponses } from '../utils/apiResponses'
import UserService from '../services/userService'
import { renderActions } from '../utils/actions'
import { setCaseListUrl } from '../utils/backlinks'
import { breadcrumbs } from '../utils/breadcrumbs'

export default class CasesController {
  constructor(
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
    private readonly referralsService: ReferralsService,
    private readonly eligibilityService: EligibilityService,
    private readonly dutyToReferService: DutyToReferService,
    private readonly proposedAddressesService: ProposedAddressesService,
    private readonly accommodationService: AccommodationService,
    private readonly userService: UserService,
  ) {}

  index(): RequestHandler {
    return async (req: IndexRequest, res: Response) => {
      const { token, username, displayName: userFullName } = res.locals.user
      await this.auditService.logPageView(Page.CASES_LIST, { who: username, correlationId: req.id })
      const { query } = req
      const { peopleType = 'nfarisk' } = query

      setCaseListUrl(req)

      const {
        data: { teams, cases },
      } = await collectApiResponses({
        teams: this.userService.getTeams(token),
        cases: this.casesService.getCases(token, { ...query, peopleType }),
      })
      const filters = queryToFilters(query, req.originalUrl, teams)

      const currentUsername = query.teamCode ? username : undefined

      return res.render('pages/index', {
        peopleType,
        tabs: casesTabs(req.originalUrl, peopleType),
        resultsSummary: casesResultsSummary(cases),
        casesTableColumns: casesTableColumns(),
        casesRows: casesToRows(cases, currentUsername),
        query,
        filters,
        assignedToOptions: assignedToOptions(userFullName, teams),
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
    return async (req: IndexRequest, res: Response) => {
      const searchTerm = req.query.searchTerm ?? req.session.searchTerm
      delete req.session.searchTerm
      let caseData: CaseDto | null = null

      await this.auditService.logPageView(Page.CASES_SEARCH, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const isValidSearchCrn = searchTerm != null && validateSearchCrn(req, searchTerm)
      if (isValidSearchCrn) {
        req.session.searchTerm = searchTerm
        const { token } = res.locals.user
        const { data } = await this.casesService.searchByCrn(token, searchTerm)
        caseData = data
      }

      const { errors, errorSummary } = fetchErrorsAndUserInput(req)
      return res.render('pages/search', {
        crn: searchTerm,
        resultsSummary: isValidSearchCrn ? searchResultsSummary(searchTerm, caseData) : undefined,
        casesTableColumns: casesTableColumns(),
        casesRows: caseToRows(caseData),
        errors,
        errorSummary,
      })
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

      const { data: caseData } = await this.casesService.getCase(token, crn)

      if (caseData.userAccess === 'LIMITED') {
        return res.render('pages/show-excluded', { caseData })
      }

      const { data, upstreamFailures } = await collectApiResponses({
        referralHistory: this.referralsService.getReferralHistory(token, crn),
        eligibility: this.eligibilityService.getEligibility(token, crn),
        proposedAddresses: this.proposedAddressesService.getProposedAddresses(token, crn),
        accommodationHistory: this.accommodationService.getAccommodationHistory(token, crn),
        accommodationSummaries: this.accommodationService.getAccommodationSummary(token, crn),
      })

      return res.render('pages/show', {
        breadcrumbs: breadcrumbs(req),
        displayName: displayName(caseData),
        caseData,
        upstreamFailures,
        assignedTo: caseAssignedTo(caseData, res.locals?.user?.username),
        nextActions: renderActions(data.eligibility?.caseActions),
        noFixedAbode: noFixedAbodeAlert(data.accommodationSummaries),
        nextAccommodationCard: accommodationCard('next', data.accommodationSummaries?.nextAccommodation),
        currentAccommodationCard: accommodationCard('current', data.accommodationSummaries?.currentAccommodation),
        referralHistoryRows: referralHistoryRows(data.referralHistory, res.locals?.user?.username, crn),
        eligibilityCards: data.eligibility ? eligibilityToEligibilityCards(data.eligibility, crn) : [],
        proposedAddresses: data.proposedAddresses.proposed.map(proposedAddressStatusCard),
        accommodationHistoryRows: accommodationHistoryRows(data.accommodationHistory),
        failedChecksAddresses: data.proposedAddresses.failedChecks.map(proposedAddressStatusCard),
      })
    }
  }
}
