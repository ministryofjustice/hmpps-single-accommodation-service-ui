import { Request, RequestHandler, Response } from 'express'
import { DtrCommand } from '@sas/api'
import uiPaths from '../paths/ui'
import {
  validateSubmission,
  summaryListRows,
  validateOutcome,
  detailsSummaryListRows,
  outcomeDetailsSummaryListRows,
  dutyToReferTimelineEntry,
  outcomeReasonToStatus,
  submissionFormValues,
  validateWithdraw,
  validateNote,
  outcomeReasonLabels,
  withdrawReasonLabels,
} from '../utils/dutyToRefer'
import CasesService from '../services/casesService'
import DutyToReferService from '../services/dutyToReferService'
import AuditService, { Page } from '../services/auditService'
import {
  addGenericErrorToFlash,
  addUserInputToFlash,
  fetchErrorsAndUserInput,
} from '../utils/validation'
import { dateInputToIsoDate } from '../utils/dates'
import ReferenceDataService from '../services/referenceDataService'
import { caseAssignedTo } from '../utils/cases'
import { collectApiResponses } from '../utils/apiResponses'
import { radioItems } from '../utils/utils'

export type SubmissionFlow = 'add' | 'addNew' | 'edit'

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

  submission(flow: SubmissionFlow): RequestHandler {
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

      const pageTitleAction = { add: 'Add', addNew: 'Add new', edit: 'Edit' }[flow]

      return res.render('pages/duty-to-refer/submission', {
        pageTitle: `${pageTitleAction} Duty to Refer (DTR) referral details`,
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

  saveSubmission(flow: SubmissionFlow): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user
      const { localAuthorityAreaId, referenceNumber, submissionNote } = req.body
      const errorRedirect = {
        add: uiPaths.dutyToRefer.submission,
        addNew: uiPaths.dutyToRefer.newSubmission,
        edit: uiPaths.dutyToRefer.edit,
      }[flow]({ crn, id })

      if (!validateSubmission(req)) {
        return res.redirect(errorRedirect)
      }

      const submissionDate = dateInputToIsoDate(req.body, 'submissionDate')

      try {
        const submission: DtrCommand = {
          status: 'SUBMITTED',
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
          submissionNote: submissionNote || null,
        }

        if (id) {
          const { data: dtr } = await this.dutyToReferService.getDtrBySubmissionId(token, crn, id)
          if (dtr.status !== 'SUBMITTED') {
            submission.status = dtr.status
            submission.outcomeReason = dtr.submission?.outcomeReason
            submission.outcomeNote = dtr.submission?.outcomeNote || null
          }
          await this.dutyToReferService.update(token, crn, id, submission)
          req.flash('success', 'Submission details updated')
          return res.redirect(uiPaths.dutyToRefer.show({ crn, id }))
        }

        await this.dutyToReferService.submit(token, crn, submission)

        if (flow === 'addNew') {
          const {
            data: { name },
          } = await this.casesService.getCase(token, crn)

          req.flash('success', {
            heading: 'New DTR referral details added',
            body: `<p>The previous referral has been moved to ${name}'s referral history</p>`,
          })
        } else {
          req.flash('success', 'New DTR referral details added')
        }

        return res.redirect(uiPaths.cases.show({ crn }))
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

      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)
      const outcomeReason = userInput?.outcomeReason ?? dtr?.submission?.outcomeReason

      return res.render('pages/duty-to-refer/outcome', {
        pageTitle: `${dtr.status === 'SUBMITTED' ? 'Add' : 'Edit'} Duty to Refer (DTR) outcome`,
        backLinkHref: uiPaths.dutyToRefer.show({ crn, id }),
        crn,
        dtr,
        tableRows,
        outcomeItems: radioItems(outcomeReasonLabels, outcomeReason),
        outcomeNote: userInput?.outcomeNote ?? dtr?.submission?.outcomeNote,
        errors,
        errorSummary,
      })
    }
  }

  saveOutcome(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user
      const {
        outcomeReason,
        currentStatus,
        submissionDate,
        localAuthorityAreaId,
        referenceNumber,
        submissionNote,
        outcomeNote,
      } = req.body
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
          submissionNote: submissionNote || null,
          outcomeNote: outcomeNote || null,
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
      const withdrawalReason = userInput?.withdrawalReason ?? dtr?.submission?.withdrawalReason

      return res.render('pages/duty-to-refer/withdraw', {
        pageTitle: 'Withdraw referral',
        backLinkHref: uiPaths.dutyToRefer.show({ crn, id }),
        crn,
        dtr,
        tableRows,
        withdrawalReasonItems: radioItems(withdrawReasonLabels, withdrawalReason),
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
      const {
        submissionDate,
        localAuthorityAreaId,
        referenceNumber,
        withdrawalReason,
        withdrawalReasonOther,
        submissionNote,
        outcomeReason,
        outcomeNote,
      } = req.body
      const errorRedirect = uiPaths.dutyToRefer.withdraw({ crn, id })

      if (!validateWithdraw(req)) {
        return res.redirect(errorRedirect)
      }

      try {
        const withdrawal: DtrCommand = {
          status: 'WITHDRAWN',
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
          withdrawalReason,
          withdrawalReasonOther: withdrawalReasonOther || null,
          submissionNote: submissionNote || null,
        }

        if (outcomeReason) {
          withdrawal.outcomeReason = outcomeReason
          withdrawal.outcomeNote = outcomeNote || null
        }

        await this.dutyToReferService.update(token, crn, id, withdrawal)

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

      if (!validateNote(req)) {
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
