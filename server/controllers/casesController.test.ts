import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import CasesController from './casesController'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import ReferralsService from '../services/referralsService'
import { user } from '../routes/testutils/appSetup'
import {
  accommodationSummariesFactory,
  accommodationSummaryFactory,
  apiResponseFactory,
  caseFactory,
  eligibilityFactory,
  proposedAccommodationFactory,
  referralFactory,
} from '../testutils/factories'
import { caseAssignedTo, casesResultsSummary, casesTableColumns, casesToRows, queryToFilters } from '../utils/cases'
import EligibilityService from '../services/eligibilityService'
import DutyToReferService from '../services/dutyToReferService'
import ProposedAddressesService from '../services/proposedAddressesService'
import { eligibilityToEligibilityCards } from '../utils/eligibility'
import { proposedAddressStatusCard } from '../utils/proposedAddresses'
import { referralHistoryRows } from '../utils/referrals'
import AccommodationService from '../services/accommodationService'
import { accommodationCard, accommodationHistoryRows, noFixedAbodeAlert } from '../utils/accommodationSummary'
import UserService from '../services/userService'
import { renderActions } from '../utils/actions'
import * as backLinksUtils from '../utils/backlinks'

describe('casesController', () => {
  const TEST_TOKEN = 'test-token'

  let request: Request
  const response = mock<Response>({
    locals: { user: { token: TEST_TOKEN, username: 'user1', userId: 'user-id-1', displayName: 'Jane Doe' } },
  })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const casesService = mock<CasesService>()
  const referralsService = mock<ReferralsService>()
  const eligibilityService = mock<EligibilityService>()
  const dutyToReferService = mock<DutyToReferService>()
  const proposedAddressesService = mock<ProposedAddressesService>()
  const accommodationService = mock<AccommodationService>()
  const userService = mock<UserService>()

  const casesController = new CasesController(
    auditService,
    casesService,
    referralsService,
    eligibilityService,
    dutyToReferService,
    proposedAddressesService,
    accommodationService,
    userService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    request = mock<Request>({ id: 'request-id', url: '/' })
  })

  describe('index', () => {
    const teams = [{ code: 'team-code', name: 'Team Name' }]
    const baseContext = {
      assignedToOptions: [
        { value: '', text: 'You (J. Doe)' },
        { value: 'team-code', text: 'Team Name' },
      ],
      riskLevelOptions: [
        { value: '', text: 'All' },
        { value: 'VERY_HIGH', text: 'Very high' },
        { value: 'HIGH', text: 'High' },
        { value: 'MEDIUM', text: 'Medium' },
        { value: 'LOW', text: 'Low' },
      ],
    }

    beforeEach(() => {
      userService.getTeams.mockResolvedValue(apiResponseFactory.buildResponse(teams))
      jest.spyOn(backLinksUtils, 'setCaseListUrl')
    })

    it('renders the case list page for the current user by default', async () => {
      const cases = caseFactory.buildList(3)
      casesService.getCases.mockResolvedValue(apiResponseFactory.caseList(cases))

      request.query = {}

      await casesController.index()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASES_LIST, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(backLinksUtils.setCaseListUrl).toHaveBeenCalledWith(request)
      expect(userService.getTeams).toHaveBeenCalledWith(TEST_TOKEN)
      expect(casesService.getCases).toHaveBeenCalledWith(TEST_TOKEN, {})
      expect(response.render).toHaveBeenCalledWith('pages/index', {
        ...baseContext,
        resultsSummary: casesResultsSummary(cases),
        casesTableColumns: casesTableColumns(),
        casesRows: casesToRows(cases),
        filters: [],
        query: {},
      })
    })

    it('renders a filtered case list page', async () => {
      const cases = caseFactory.buildList(3, { riskLevel: 'HIGH' })
      casesService.getCases.mockResolvedValue(apiResponseFactory.caseList(cases))

      request.query = {
        searchTerm: 'some-crn',
        riskLevel: 'HIGH',
        teamCode: 'team-code',
      }
      request.url = '/?teamCode=team-code&searchTerm=some-crn&riskLevel=HIGH'

      await casesController.index()(request, response, next)

      expect(casesService.getCases).toHaveBeenCalledWith(TEST_TOKEN, {
        searchTerm: 'some-crn',
        riskLevel: 'HIGH',
        teamCode: 'team-code',
      })
      expect(backLinksUtils.setCaseListUrl).toHaveBeenCalledWith(request)
      expect(response.render).toHaveBeenCalledWith('pages/index', {
        ...baseContext,
        resultsSummary: casesResultsSummary(cases),
        filters: queryToFilters(request.query, request.url, teams),
        casesTableColumns: casesTableColumns(),
        casesRows: casesToRows(cases, 'user1'),
        query: request.query,
      })
    })
  })

  describe('show', () => {
    it('renders the case details page', async () => {
      const crn = 'X123456'
      request.params.crn = crn

      const caseData = caseFactory.build({ crn, name: 'John Smith', limitedAccess: true })
      const referralHistory = referralFactory.buildList(2)
      const eligibility = eligibilityFactory.build()
      const proposed = proposedAccommodationFactory.buildList(2, { verificationStatus: 'NOT_CHECKED_YET' })
      const failedChecks = proposedAccommodationFactory.buildList(1, { verificationStatus: 'FAILED' })
      const currentAccommodation = accommodationSummaryFactory.current().build()
      const nextAccommodation = accommodationSummaryFactory.next().build()
      const accommodationHistory = accommodationSummaryFactory.buildListSequential(2)
      const accommodationSummaries = accommodationSummariesFactory.build()

      casesService.getCase.mockResolvedValue(apiResponseFactory.case(caseData))
      referralsService.getReferralHistory.mockResolvedValue(apiResponseFactory.referralHistory(referralHistory))
      eligibilityService.getEligibility.mockResolvedValue(apiResponseFactory.eligibility(eligibility))
      proposedAddressesService.getProposedAddresses.mockResolvedValue({ data: { proposed, failedChecks } })
      accommodationService.getCurrentAccommodation.mockResolvedValue(
        apiResponseFactory.accommodationSummary(currentAccommodation),
      )
      accommodationService.getNextAccommodation.mockResolvedValue(
        apiResponseFactory.accommodationSummary(nextAccommodation),
      )
      accommodationService.getAccommodationHistory.mockResolvedValue(
        apiResponseFactory.accommodationHistory(accommodationHistory),
      )
      accommodationService.getAccommodationSummary.mockResolvedValue(
        apiResponseFactory.accommodationSummaries(accommodationSummaries),
      )

      await casesController.show()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASE_PROFILE_TRACKER, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith(TEST_TOKEN, crn)
      expect(referralsService.getReferralHistory).toHaveBeenCalledWith(TEST_TOKEN, crn)
      expect(eligibilityService.getEligibility).toHaveBeenCalledWith(TEST_TOKEN, crn)
      expect(proposedAddressesService.getProposedAddresses).toHaveBeenCalledWith(TEST_TOKEN, crn)
      expect(accommodationService.getAccommodationHistory).toHaveBeenCalledWith(TEST_TOKEN, crn)

      expect(response.render).toHaveBeenCalledWith('pages/show', {
        caseData: { ...caseData, name: 'John Smith (limited access offender)' },
        upstreamFailures: [],
        assignedTo: caseAssignedTo(caseData, response.locals.user.username),
        nextActions: renderActions(eligibility.caseActions),
        noFixedAbode: noFixedAbodeAlert(accommodationSummaries),
        nextAccommodationCard: accommodationCard('next', nextAccommodation),
        currentAccommodationCard: accommodationCard('current', currentAccommodation),
        referralHistoryRows: referralHistoryRows(referralHistory),
        eligibilityCards: eligibilityToEligibilityCards(eligibility, crn),
        proposedAddresses: proposed.map(proposedAddressStatusCard),
        accommodationHistoryRows: accommodationHistoryRows(accommodationHistory),
        failedChecksAddresses: failedChecks.map(proposedAddressStatusCard),
      })
    })

    it('renders a separate template for an LAO case and does not call the API for extra info', async () => {
      const crn = 'X666667'
      request.params.crn = crn

      const caseData = caseFactory.limitedAccess().build({ crn })
      casesService.getCase.mockResolvedValue(apiResponseFactory.case(caseData))

      await casesController.show()(request, response, next)

      expect(casesService.getCase).toHaveBeenCalledWith(TEST_TOKEN, crn)

      expect(referralsService.getReferralHistory).not.toHaveBeenCalled()
      expect(eligibilityService.getEligibility).not.toHaveBeenCalled()
      expect(proposedAddressesService.getProposedAddresses).not.toHaveBeenCalled()
      expect(accommodationService.getAccommodationHistory).not.toHaveBeenCalled()

      expect(response.render).toHaveBeenCalledWith('pages/show-excluded', {
        caseData,
      })
    })

    it('renders the case details page with upstream failures', async () => {
      const crn = 'X666667'
      request.params.crn = crn

      const caseData = caseFactory.build({ crn })

      casesService.getCase.mockResolvedValue(apiResponseFactory.case(caseData))
      proposedAddressesService.getProposedAddresses.mockResolvedValue({ data: { proposed: [], failedChecks: [] } })
      accommodationService.getCurrentAccommodation.mockResolvedValue(apiResponseFactory.accommodationSummary())
      accommodationService.getNextAccommodation.mockResolvedValue(apiResponseFactory.accommodationSummary())
      accommodationService.getAccommodationSummary.mockResolvedValue(apiResponseFactory.accommodationSummaries())

      eligibilityService.getEligibility.mockResolvedValue(apiResponseFactory.withUpstreamFailures())
      referralsService.getReferralHistory.mockResolvedValue(apiResponseFactory.withUpstreamFailures())
      accommodationService.getAccommodationHistory.mockResolvedValue(apiResponseFactory.withUpstreamFailures())

      await casesController.show()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/show',
        expect.objectContaining({
          nextActions: [],
          eligibilityCards: [],
          upstreamFailures: expect.arrayContaining(['eligibility', 'referralHistory', 'accommodationHistory']),
        }),
      )
    })
  })
})
