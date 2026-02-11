import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import CasesController from './casesController'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import ReferralsService from '../services/referralsService'
import { user } from '../routes/testutils/appSetup'
import {
  accommodationFactory,
  caseFactory,
  dutyToReferFactory,
  eligibilityFactory,
  referralFactory,
} from '../testutils/factories'
import { accommodationCard, caseAssignedTo, casesTableCaption, casesToRows, referralHistoryTable } from '../utils/cases'
import EligibilityService from '../services/eligibilityService'
import DutyToReferService from '../services/dutyToReferService'
import ProposedAddressesService from '../services/proposedAddressesService'
import { eligibilityToEligibilityCards } from '../utils/eligibility'
import { statusCard } from '../utils/components'
import { dutyToReferStatusCard } from '../utils/dutyToRefer'
import { proposedAddressStatusCard } from '../utils/proposedAddresses'

describe('casesController', () => {
  const TEST_TOKEN = 'test-token'

  let request: Request
  const response = mock<Response>({ locals: { user: { token: TEST_TOKEN, username: 'user1', userId: 'user-id-1' } } })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const casesService = mock<CasesService>()
  const referralsService = mock<ReferralsService>()
  const eligibilityService = mock<EligibilityService>()
  const dutyToReferService = mock<DutyToReferService>()
  const proposedAddressesService = mock<ProposedAddressesService>()

  const casesController = new CasesController(
    auditService,
    casesService,
    referralsService,
    eligibilityService,
    dutyToReferService,
    proposedAddressesService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    request = mock<Request>({ id: 'request-id' })
  })

  describe('index', () => {
    it('renders the case list page for the current user by default', async () => {
      const cases = caseFactory.buildList(3)
      casesService.getCases.mockResolvedValue(cases)

      request.query = {}

      await casesController.index()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASES_LIST, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(casesService.getCases).toHaveBeenCalledWith(TEST_TOKEN, { assignedTo: 'user-id-1' })
      expect(response.render).toHaveBeenCalledWith('pages/index', {
        tableCaption: casesTableCaption(cases, { assignedTo: 'you' }),
        casesRows: casesToRows(cases),
        errors: {},
        errorSummary: [],
        query: {
          assignedTo: 'you',
        },
      })
    })

    it('renders a filtered case list page', async () => {
      const cases = caseFactory.buildList(3, { riskLevel: 'HIGH' })
      casesService.getCases.mockResolvedValue(cases)

      request.query = {
        searchTerm: 'some-crn',
        assignedTo: 'anyone',
        riskLevel: 'HIGH',
      }

      await casesController.index()(request, response, next)

      expect(casesService.getCases).toHaveBeenCalledWith(TEST_TOKEN, {
        searchTerm: 'some-crn',
        assignedTo: '',
        riskLevel: 'HIGH',
      })
      expect(response.render).toHaveBeenCalledWith('pages/index', {
        tableCaption: casesTableCaption(cases, request.query),
        casesRows: casesToRows(cases),
        query: request.query,
        errors: {},
        errorSummary: [],
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
      const dutyToRefer = dutyToReferFactory.buildList(1)
      const proposed = accommodationFactory.proposed().buildList(2, { verificationStatus: 'NOT_CHECKED_YET' })
      const failedChecks = accommodationFactory.proposed().buildList(1, { verificationStatus: 'FAILED' })

      casesService.getCase.mockResolvedValue(caseData)
      referralsService.getReferralHistory.mockResolvedValue(referralHistory)
      eligibilityService.getEligibility.mockResolvedValue(eligibility)
      dutyToReferService.getDutyToRefer.mockResolvedValue(dutyToRefer)
      proposedAddressesService.getProposedAddresses.mockResolvedValue({ proposed, failedChecks })

      await casesController.show()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASE_PROFILE_TRACKER, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith(TEST_TOKEN, crn)
      expect(referralsService.getReferralHistory).toHaveBeenCalledWith(TEST_TOKEN, crn)
      expect(eligibilityService.getEligibility).toHaveBeenCalledWith(TEST_TOKEN, crn)
      expect(dutyToReferService.getDutyToRefer).toHaveBeenCalledWith(TEST_TOKEN, crn)
      expect(proposedAddressesService.getProposedAddresses).toHaveBeenCalledWith(TEST_TOKEN, crn)

      expect(response.render).toHaveBeenCalledWith('pages/show', {
        caseData,
        assignedTo: caseAssignedTo(caseData, response.locals.user.userId),
        nextAccommodationCard: accommodationCard('next', caseData.nextAccommodation),
        currentAccommodationCard: accommodationCard('current', caseData.currentAccommodation),
        referralHistory: referralHistoryTable(referralHistory),
        eligibilityCards: eligibilityToEligibilityCards(eligibility).map(statusCard),
        dutyToReferCard: statusCard(dutyToReferStatusCard(dutyToRefer[0])),
        proposedAddresses: proposed.map(proposedAddressStatusCard).map(statusCard),
        failedChecksAddresses: failedChecks.map(proposedAddressStatusCard).map(statusCard),
      })
    })
  })
})
