import { Request, RequestHandler, Response } from 'express'
import uiPaths from '../paths/ui'
import { validateSubmission, summaryListRows, validateOutcome, detailsSummaryListRows, outcomeDetailsSummaryListRows } from '../utils/dutyToRefer'
import CasesService from '../services/casesService'
import DutyToReferService from '../services/dutyToReferService'
import AuditService, { Page } from '../services/auditService'
import { addGenericErrorToFlash, fetchErrorsAndUserInput } from '../utils/validation'
import { dateInputToIsoDate } from '../utils/dates'
import ReferenceDataService from '../services/referenceDataService'
import { caseAssignedTo } from '../utils/cases'
import { getFlowRedirect, setFlowRedirect } from '../utils/backlinks'

export default class DutyToReferController {
  constructor(
    private readonly auditService: AuditService,
    private readonly dutyToReferService: DutyToReferService,
    private readonly casesService: CasesService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user

      await this.auditService.logPageView(Page.DUTY_TO_REFER_DETAILS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const [caseData, dutyToRefer] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.dutyToReferService.getDutyToRefer(token, crn),
      ])

      const submissionDetailRows = dutyToRefer ? detailsSummaryListRows(dutyToRefer) : undefined
      const outcomeDetailRows = dutyToRefer ? outcomeDetailsSummaryListRows(dutyToRefer) : undefined

      return res.render('pages/duty-to-refer/show', {
        crn,
        caseData,
        assignedTo: caseAssignedTo(caseData, res.locals?.user?.userId),
        submissionDetailRows,
        outcomeDetailRows,
        status: dutyToRefer?.status,
      })
    }
  }

  guidance(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params

      setFlowRedirect(uiPaths.dutyToRefer.guidance.pattern, req, [
        uiPaths.dutyToRefer.show.pattern,
        uiPaths.cases.show.pattern,
      ])

      await this.auditService.logPageView(Page.DUTY_TO_REFER_GUIDANCE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      return res.render('pages/duty-to-refer/guidance', {
        crn,
      })
    }
  }

  submission(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn } = req.params

      await this.auditService.logPageView(Page.DUTY_TO_REFER_SUBMISSION, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { tableRows, localAuthorities } = await this.getSubmissionPageData(token, crn)
      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      return res.render('pages/duty-to-refer/submission', {
        crn,
        tableRows,
        localAuthorities,
        errors,
        errorSummary,
        formValues: userInput,
      })
    }
  }

  submit(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user
      const { localAuthorityAreaId, referenceNumber } = req.body

      if (!validateSubmission(req)) {
        return res.redirect(uiPaths.dutyToRefer.submission({ crn }))
      }

      const submissionDate = dateInputToIsoDate(req.body, 'submissionDate')
      const redirect = getFlowRedirect(uiPaths.dutyToRefer.guidance.pattern, req, uiPaths.cases.show({ crn }))

      try {
        await this.dutyToReferService.submit(token, crn, {
          status: 'SUBMITTED',
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
        })

        req.flash('success', 'Submission details added')
        return res.redirect(redirect)
      } catch {
        addGenericErrorToFlash(req, 'There was a problem submitting the duty to refer. Please try again.')
        return res.redirect(uiPaths.dutyToRefer.submission({ crn }))
      }
    }
  }

  outcome(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user

      await this.auditService.logPageView(Page.DUTY_TO_REFER_OUTCOME, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const [caseData, dtr] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.dutyToReferService.getDutyToRefer(token, crn),
      ])

      const tableRows = summaryListRows(caseData, dtr)

      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      setFlowRedirect(uiPaths.dutyToRefer.outcome.pattern, req, [
        uiPaths.dutyToRefer.show.pattern,
        uiPaths.cases.show.pattern,
      ])

      return res.render('pages/duty-to-refer/outcome', {
        crn,
        tableRows,
        errors,
        errorSummary,
      })
    }
  }

  update(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user
      const { outcomeStatus } = req.body

      if (!validateOutcome(req)) return res.redirect(uiPaths.dutyToRefer.outcome({ crn }))

      const redirect = getFlowRedirect(uiPaths.dutyToRefer.outcome.pattern, req, uiPaths.cases.show({ crn }))

      try {
        const dtr = await this.dutyToReferService.getDutyToRefer(token, crn)
        const submission = dtr?.submission
        await this.dutyToReferService.update(token, crn, submission.id, {
          status: outcomeStatus,
          submissionDate: submission.submissionDate,
          localAuthorityAreaId: submission.localAuthority?.localAuthorityAreaId,
          referenceNumber: submission.referenceNumber,
        })

        req.flash('success', 'Outcome details added')
        return res.redirect(redirect)
      } catch {
        addGenericErrorToFlash(req, 'There was a problem updating the duty to refer. Please try again.')
        return res.redirect(uiPaths.dutyToRefer.outcome({ crn }))
      }
    }
  }

  private async getSubmissionPageData(token: string, crn: string) {
    const [caseData, localAuthorities] = await Promise.all([
      this.casesService.getCase(token, crn),
      this.referenceDataService.getLocalAuthorities(token),
    ])

    const tableRows = summaryListRows(caseData)

    return { tableRows, localAuthorities }
  }
}
