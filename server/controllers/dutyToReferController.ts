import { Request, RequestHandler, Response } from 'express'
import uiPaths from '../paths/ui'
import { summaryListRows, validateOutcome, validateSubmission } from '../utils/dutyToRefer'
import CasesService from '../services/casesService'
import DutyToReferService from '../services/dutyToReferService'
import AuditService, { Page } from '../services/auditService'
import { addErrorToFlash, fetchErrors } from '../utils/validation'
import { dateInputToIsoDate } from '../utils/dates'
import ReferenceDataService from '../services/referenceDataService'

export default class DutyToReferController {
  constructor(
    private readonly auditService: AuditService,
    private readonly dutyToReferService: DutyToReferService,
    private readonly casesService: CasesService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  guidance(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params

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

      const caseData = await this.casesService.getCase(token, crn)
      const tableRows = summaryListRows(caseData)

      const { errors, errorSummary } = fetchErrors(req)
      const localAuthorities = await this.referenceDataService.getLocalAuthorities(token)

      return res.render('pages/duty-to-refer/submission', {
        crn,
        tableRows,
        localAuthorities,
        errors,
        errorSummary,
      })
    }
  }

  submit(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user
      const { localAuthorityAreaId, referenceNumber } = req.body

      const redirect = validateSubmission(req)
      if (redirect) return res.redirect(redirect)

      const submissionDate = dateInputToIsoDate(req.body, 'submissionDate')

      try {
        await this.dutyToReferService.submit(token, crn, {
          status: 'SUBMITTED',
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
        })

        req.flash('success', 'Submission details added')
        return res.redirect(uiPaths.cases.show({ crn }))
      } catch (error) {
        // TODO replace this with generic error
        addErrorToFlash(req, 'submission', 'There was a problem submitting the duty to refer. Please try again.')
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

      const caseData = await this.casesService.getCase(token, crn)
      const dtr = await this.dutyToReferService.getDutyToRefer(token, crn)
      const tableRows = summaryListRows(caseData, dtr)

      const { errors, errorSummary } = fetchErrors(req)

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

      const redirect = validateOutcome(req)
      if (redirect) return res.redirect(redirect)

      try {
        const dtr = await this.dutyToReferService.getDutyToRefer(token, crn)
        const submissionDate = dtr?.submission?.submissionDate
        const localAuthorityAreaId = dtr?.submission?.localAuthorityAreaId
        const referenceNumber = dtr?.submission?.referenceNumber
        await this.dutyToReferService.update(token, crn, dtr.submission.id, {
          status: outcomeStatus,
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
        })

        req.flash('success', 'Submission details updated')
        return res.redirect(uiPaths.cases.show({ crn }))
      } catch (error) {
        // TODO replace this with generic error
        addErrorToFlash(req, 'submission', 'There was a problem updating duty to refer. Please try again.')
        return res.redirect(uiPaths.dutyToRefer.outcome({ crn }))
      }
    }
  }
}
