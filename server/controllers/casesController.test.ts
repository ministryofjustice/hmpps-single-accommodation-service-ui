import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import CasesController from './casesController'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import ReferralsService from '../services/referralsService'
import { user } from '../routes/testutils/appSetup'
import {
  accommodationFactory,
  accommodationSummaryFactory,
  apiResponseFactory,
  caseFactory,
  eligibilityFactory,
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
import { accommodationCard, accommodationHistoryRows } from '../utils/accommodationSummary'

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

  const casesController = new CasesController(
    auditService,
    casesService,
    referralsService,
    eligibilityService,
    dutyToReferService,
    proposedAddressesService,
    accommodationService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    request = mock<Request>({ id: 'request-id', url: '/' })
  })

  describe('index', () => {
    const baseContext = {
      assignedToOptions: [{ value: 'you', text: 'You (J. Doe)' }],
      riskLevelOptions: [
        { value: '', text: 'All' },
        { value: 'VERY_HIGH', text: 'Very high' },
        { value: 'HIGH', text: 'High' },
        { value: 'MEDIUM', text: 'Medium' },
        { value: 'LOW', text: 'Low' },
      ],
    }

    it('renders the case list page for the current user by default', async () => {
      const cases = caseFactory.buildList(3)
      casesService.getCases.mockResolvedValue(apiResponseFactory.caseList(cases))

      request.query = {}

      await casesController.index()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASES_LIST, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(casesService.getCases).toHaveBeenCalledWith(TEST_TOKEN, {})
      expect(response.render).toHaveBeenCalledWith('pages/index', {
        ...baseContext,
        resultsSummary: casesResultsSummary(cases),
        casesTableColumns: casesTableColumns(),
        casesRows: casesToRows(cases),
        filters: [],
        query: {
          assignedTo: 'you',
        },
      })
    })

    it('renders a filtered case list page', async () => {
      const cases = caseFactory.buildList(3, { riskLevel: 'HIGH' })
      casesService.getCases.mockResolvedValue(apiResponseFactory.caseList(cases))

      request.query = {
        searchTerm: 'some-crn',
        riskLevel: 'HIGH',
      }
      request.url = '/?searchTerm=some-crn&riskLevel=HIGH'

      await casesController.index()(request, response, next)

      expect(casesService.getCases).toHaveBeenCalledWith(TEST_TOKEN, {
        searchTerm: 'some-crn',
        riskLevel: 'HIGH',
      })
      expect(response.render).toHaveBeenCalledWith('pages/index', {
        ...baseContext,
        resultsSummary: casesResultsSummary(cases),
        filters: queryToFilters(request.query, request.url),
        casesTableColumns: casesTableColumns(),
        casesRows: casesToRows(cases),
        query: request.query,
      })
    })
  })

  describe('show', () => {
    it('renders the case details page', async () => {
      const crn = 'X123456'
      request.params.crn = crn

      const caseData = caseFactory.build({ crn })
      const referralHistory = referralFactory.buildList(2)
      const eligibility = eligibilityFactory.build()
      const proposed = accommodationFactory.proposed().buildList(2, { verificationStatus: 'NOT_CHECKED_YET' })
      const failedChecks = accommodationFactory.proposed().buildList(1, { verificationStatus: 'FAILED' })
      const currentAccommodation = accommodationFactory.current().build()
      const nextAccommodation = accommodationFactory.next().build()
      const accommodationHistory = accommodationSummaryFactory.buildListSequential(2)

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
        caseData,
        assignedTo: caseAssignedTo(caseData, response.locals.user.username),
        nextActions: eligibility.caseActions,
        nextAccommodationCard: accommodationCard('next', nextAccommodation),
        currentAccommodationCard: accommodationCard('current', currentAccommodation),
        referralHistoryRows: referralHistoryRows(referralHistory),
        eligibilityCards: eligibilityToEligibilityCards(eligibility, crn),
        proposedAddresses: proposed.map(proposedAddressStatusCard),
        accommodationHistoryRows: accommodationHistoryRows(accommodationHistory),
        failedChecksAddresses: failedChecks.map(proposedAddressStatusCard),
      })
    })
  })
})
