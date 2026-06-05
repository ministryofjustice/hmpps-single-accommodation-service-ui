import { Request, RequestHandler, Response } from 'express'
import uiPaths from '../paths/ui'
import {
  validateSubmission,
  summaryListRows,
  validateOutcome,
  detailsSummaryListRows,
  outcomeDetailsSummaryListRows,
  dutyToReferTimelineEntry,
  outcomeItems,
  outcomeReasonToStatus,
  submissionFormValues,
  withdrawalReasonItems,
  validateWithdraw,
} from '../utils/dutyToRefer'
import CasesService from '../services/casesService'
import DutyToReferService from '../services/dutyToReferService'
import AuditService, { Page } from '../services/auditService'
import {
  addGenericErrorToFlash,
  addUserInputToFlash,
  fetchErrorsAndUserInput,
  validateAndFlashErrors,
} from '../utils/validation'
import { dateInputToIsoDate } from '../utils/dates'
import ReferenceDataService from '../services/referenceDataService'
import { caseAssignedTo } from '../utils/cases'
import { collectApiResponses } from '../utils/apiResponses'

export default class DutyToReferController {
  constructor(
    private readonly auditService: AuditService,
    private readonly dutyToReferService: DutyToReferService,
    private readonly casesService: CasesService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user

      await this.auditService.logPageView(Page.DUTY_TO_REFER_DETAILS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const [{ data: caseData }, { data: dutyToRefer }, { data: auditRecords }] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.dutyToReferService.getDtrBySubmissionId(token, crn, id),
        this.dutyToReferService.getTimeline(token, crn, id),
      ])

      const submissionDetailRows = detailsSummaryListRows(dutyToRefer)
      const outcomeDetailRows = outcomeDetailsSummaryListRows(dutyToRefer)

      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      return res.render('pages/duty-to-refer/show', {
        crn,
        dtrId: id,
        caseData,
        assignedTo: caseAssignedTo(caseData, res.locals?.user?.username),
        submissionDetailRows,
        outcomeDetailRows,
        timeline: auditRecords.map(dutyToReferTimelineEntry),
        status: dutyToRefer?.status,
        ...userInput,
        errors,
        errorSummary,
      })
    }
  }

  submission(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn, id } = req.params

      const backLinkHref = id ? uiPaths.dutyToRefer.show({ crn, id }) : uiPaths.cases.show({ crn })

      await this.auditService.logPageView(Page.DUTY_TO_REFER_SUBMISSION, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { tableRows, localAuthorities, dtr } = await this.getSubmissionPageData(token, crn, id)
      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      const formValues = {
        ...submissionFormValues(dtr),
        ...userInput,
      }

      return res.render('pages/duty-to-refer/submission', {
        pageTitle: `${id ? 'Edit' : 'Add new'} Duty to Refer (DTR) referral details`,
        backLinkHref,
        crn,
        tableRows,
        localAuthorities,
        errors,
        errorSummary,
        formValues,
      })
    }
  }

  saveSubmission(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user
      const { localAuthorityAreaId, referenceNumber } = req.body
      const errorRedirect = id ? uiPaths.dutyToRefer.edit({ crn, id }) : uiPaths.dutyToRefer.submission({ crn })

      if (!validateSubmission(req)) {
        return res.redirect(errorRedirect)
      }

      const submissionDate = dateInputToIsoDate(req.body, 'submissionDate')

      try {
        const submission = {
          status: 'SUBMITTED' as const,
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
        }

        if (id) {
          await this.dutyToReferService.update(token, crn, id, submission)
          req.flash('success', 'Submission details updated')
          return res.redirect(uiPaths.dutyToRefer.show({ crn, id }))
        }
        const dtr = await this.dutyToReferService.submit(token, crn, submission)
        req.flash('success', 'New DTR referral details added')
        return res.redirect(uiPaths.dutyToRefer.show({ crn, id: dtr.submission?.id }))
      } catch {
        addGenericErrorToFlash(req, 'There was a problem saving the submission details. Please try again.')
        return res.redirect(errorRedirect)
      }
    }
  }

  outcome(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user

      await this.auditService.logPageView(Page.DUTY_TO_REFER_OUTCOME, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const {
        data: { caseData, dtr },
      } = await collectApiResponses({
        caseData: this.casesService.getCase(token, crn),
        dtr: this.dutyToReferService.getDtrBySubmissionId(token, crn, id),
      })

      const tableRows = summaryListRows(caseData, dtr)

      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      return res.render('pages/duty-to-refer/outcome', {
        pageTitle: `${dtr.status === 'SUBMITTED' ? 'Add' : 'Edit'} Duty to Refer (DTR) outcome`,
        backLinkHref: uiPaths.dutyToRefer.show({ crn, id }),
        crn,
        dtr,
        tableRows,
        outcomeItems: outcomeItems(dtr.submission?.outcomeReason),
        errors,
        errorSummary,
      })
    }
  }

  saveOutcome(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user
      const { outcomeReason, currentStatus, submissionDate, localAuthorityAreaId, referenceNumber } = req.body
      const errorRedirect = uiPaths.dutyToRefer.outcome({ crn, id })

      if (!validateOutcome(req)) {
        return res.redirect(errorRedirect)
      }

      try {
        const outcomeStatus = outcomeReasonToStatus(outcomeReason)
        await this.dutyToReferService.update(token, crn, id, {
          status: outcomeStatus,
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
          outcomeReason,
        })

        req.flash('success', currentStatus !== 'SUBMITTED' ? 'Outcome details updated' : 'Outcome details added')
        return res.redirect(uiPaths.dutyToRefer.show({ crn, id }))
      } catch {
        addGenericErrorToFlash(req, 'There was a problem saving the outcome details. Please try again.')
        return res.redirect(errorRedirect)
      }
    }
  }

  withdraw(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user

      await this.auditService.logPageView(Page.DUTY_TO_REFER_WITHDRAW, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const {
        data: { caseData, dtr },
      } = await collectApiResponses({
        caseData: this.casesService.getCase(token, crn),
        dtr: this.dutyToReferService.getDtrBySubmissionId(token, crn, id),
      })

      const tableRows = summaryListRows(caseData, dtr)

      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      return res.render('pages/duty-to-refer/withdraw', {
        pageTitle: 'Withdraw referral',
        backLinkHref: uiPaths.dutyToRefer.show({ crn, id }),
        crn,
        dtr,
        tableRows,
        withdrawalReasonItems: withdrawalReasonItems(userInput?.withdrawalReason),
        errors,
        errorSummary,
        ...userInput,
      })
    }
  }

  saveWithdrawal(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user
      const { submissionDate, localAuthorityAreaId, referenceNumber, withdrawalReason, withdrawalReasonOther } =
        req.body
      const errorRedirect = uiPaths.dutyToRefer.withdraw({ crn, id })

      if (!validateWithdraw(req)) {
        return res.redirect(errorRedirect)
      }

      try {
        await this.dutyToReferService.update(token, crn, id, {
          status: 'WITHDRAWN',
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
          withdrawalReason,
          withdrawalReasonOther: withdrawalReasonOther || null,
        })

        req.flash('success', 'DTR referral withdrawn')
        return res.redirect(uiPaths.cases.show({ crn }))
      } catch {
        addGenericErrorToFlash(req, 'There was a problem withdrawing the DTR referral. Please try again.')
        return res.redirect(errorRedirect)
      }
    }
  }

  saveNote(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.DUTY_TO_REFER_DETAILS_ADD_NOTE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { crn, id } = req.params
      const { token } = res.locals.user
      const { note } = req.body

      if (!note) {
        validateAndFlashErrors(req, { note: 'Enter a note' })
        return res.redirect(uiPaths.dutyToRefer.show({ crn, id }))
      }

      try {
        await this.dutyToReferService.submitTimelineNote(token, crn, id, { note })
        req.flash('success', 'Note added')
      } catch (error) {
        addGenericErrorToFlash(req, error.message)
        addUserInputToFlash(req)
      }
      return res.redirect(uiPaths.dutyToRefer.show({ crn, id }))
    }
  }

  private async getSubmissionPageData(token: string, crn: string, id?: string) {
    const [{ data: caseData }, { data: localAuthorities }] = await Promise.all([
      this.casesService.getCase(token, crn),
      this.referenceDataService.getLocalAuthorities(token),
    ])

    const dtr = id ? (await this.dutyToReferService.getDtrBySubmissionId(token, crn, id))?.data : undefined

    const tableRows = summaryListRows(caseData)

    return { tableRows, localAuthorities, dtr }
  }
}
