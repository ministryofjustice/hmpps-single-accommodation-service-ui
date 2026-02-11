import { Request, RequestHandler, Response } from 'express'
import { GetCasesQuery } from '@sas/ui'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import { accommodationCard, casesTableCaption, casesToRows, caseAssignedTo, referralHistoryTable } from '../utils/cases'
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
      const { token, userId, username } = res.locals.user
      await this.auditService.logPageView(Page.CASES_LIST, { who: username, correlationId: req.id })
      const { query } = req

      if (query.assignedTo === undefined) query.assignedTo = 'you'

      const cases = await this.casesService.getCases(token, this.mapGetCasesQuery(query, userId))

      return res.render('pages/index', {
        tableCaption: casesTableCaption(cases, query),
        casesRows: casesToRows(cases),
        query,
      })
    }
  }

  private mapGetCasesQuery(query: GetCasesQuery, userId: string): GetCasesQuery {
    let { assignedTo, searchTerm, crns } = query

    if (query.assignedTo === 'you') assignedTo = userId
    if (query.assignedTo === 'anyone') assignedTo = ''

    // FIXME -- Experimental Easter Egg: allows loading a list of CRNs directly from the address bar for demo purposes,
    //  by visiting e.g. `/?crns=X371199,X960658`.
    if (crns) {
      crns = String(crns).split(',')
    }
    // FIXME -- Experimental Easter Egg: allows searching for one of the 'test' CRNs the API
    //  is able to provide mock data for.
    const findCrns = searchTerm?.match(/[A-Za-z]\d{6}/g)
    if (findCrns?.length > 0) {
      searchTerm = ''
      crns = findCrns
    }

    return {
      ...query,
      assignedTo,
      crns,
      searchTerm,
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
